'use strict';
const { PurchaseOrder, PurchaseOrderItem, Supplier, Store, Product, StoreStock } = require('../../models');
const sequelize = require('../../config/database');
const { Op } = require('sequelize');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.status = 400;
  }
}

const buildOrderItemTotals = (item, defaultTaxRate) => {
  const quantity = Math.max(0, Number(item.quantity || 0));
  const unitPrice = Number(item.unitPrice || 0);
  const discountAmount = Math.max(0, Number(item.discountAmount || 0));
  const taxRate = Number(item.taxRate ?? defaultTaxRate ?? 0);
  const gross = quantity * unitPrice;
  const net = Math.max(0, gross - discountAmount);
  const taxAmount = (net * taxRate) / 100;
  const lineTotal = net + taxAmount;
  return {
    quantity,
    unitPrice,
    discountAmount,
    taxRate,
    taxAmount,
    lineTotal
  };
};

const listPurchaseOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);
    const { status, q } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: `%${q}%` } },
        { '$supplier.name$': { [Op.iLike]: `%${q}%` } }
      ];
    }
    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'phone', 'email'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      subQuery: false
    });
    res.json({
      success: true,
      data: rows,
      pagination: buildPaginationMeta(count, { page, limit })
    });
  } catch (err) {
    next(err);
  }
};

const getPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findOne({
      where: { id: req.params.purchaseOrderId, tenantId: req.tenant.id },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
          order: [['created_at', 'ASC']]
        }
      ]
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      supplierId,
      storeId,
      items = [],
      currency,
      expectedDeliveryDate,
      notes,
      orderNumber
    } = req.body;

    if (!supplierId) throw new BadRequestError('Supplier is required.');
    if (!Array.isArray(items) || !items.length) throw new BadRequestError('At least one order item is required.');

    const supplier = await Supplier.findOne({
      where: { id: supplierId, tenantId: req.tenant.id }
    });
    if (!supplier) throw new BadRequestError('Supplier not found.');

    let store = null;
    if (storeId) {
      store = await Store.findOne({ where: { id: storeId, tenantId: req.tenant.id } });
      if (!store) throw new BadRequestError('Store not found.');
    }

    const tenantCurrency = req.tenant?.settings?.currency || 'INR';
    const defaultTaxRate = Number(req.tenant?.settings?.taxRate || 0);
    const po = await PurchaseOrder.create({
      tenantId: req.tenant.id,
      supplierId: supplier.id,
      storeId: store?.id || null,
      orderNumber: orderNumber || `PO-${Date.now().toString().slice(-6)}`,
      currency: currency || tenantCurrency,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      notes: notes || null,
      createdBy: req.user.id,
      updatedBy: req.user.id
    }, { transaction });

    let totalAmount = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const orderItems = [];

    for (const item of items) {
      const { quantity, unitPrice, discountAmount, taxRate, taxAmount, lineTotal } = buildOrderItemTotals(item, defaultTaxRate);
      if (!item.productId) throw new BadRequestError('Product is required for each item.');
      const product = await Product.findOne({ where: { id: item.productId, tenantId: req.tenant.id } });
      if (!product) throw new BadRequestError(`Product ${item.productId} not found.`);

      orderItems.push({
        purchaseOrderId: po.id,
        productId: product.id,
        quantity,
        receivedQuantity: 0,
        unitPrice,
        taxRate,
        taxAmount,
        lineTotal,
        discountAmount,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      totalAmount += lineTotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    }

    await PurchaseOrderItem.bulkCreate(orderItems, { transaction });
    await po.update({ totalAmount, taxAmount: totalTax, discountAmount: totalDiscount }, { transaction });
    await transaction.commit();

    const created = await PurchaseOrder.findOne({
      where: { id: po.id },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] }
      ]
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

const updatePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findOne({
      where: { id: req.params.purchaseOrderId, tenantId: req.tenant.id }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    const updates = {};
    ['status', 'notes', 'currency'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (req.body.expectedDeliveryDate !== undefined) {
      updates.expectedDeliveryDate = req.body.expectedDeliveryDate ? new Date(req.body.expectedDeliveryDate) : null;
    }
    updates.updatedBy = req.user.id;
    await order.update(updates);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

const receivePurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { items = [], receivedDate } = req.body;
    if (!Array.isArray(items) || !items.length) throw new BadRequestError('At least one receiving entry is required.');
    const order = await PurchaseOrder.findOne({
      where: { id: req.params.purchaseOrderId, tenantId: req.tenant.id },
      include: [
        { model: PurchaseOrderItem, as: 'items' }
      ],
      transaction
    });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }
    if (!order.storeId) throw new BadRequestError('Purchase order does not have an associated store.');

    const byProduct = new Map(order.items.map((item) => [item.productId.toString(), item]));
    for (const incoming of items) {
      const target = byProduct.get((incoming.productId || '').toString());
      if (!target) throw new BadRequestError(`Order does not include product ${incoming.productId}.`);
      const toReceive = Math.max(0, Number(incoming.quantity || 0));
      const remaining = Math.max(0, target.quantity - target.receivedQuantity);
      if (toReceive === 0) continue;
      if (toReceive > remaining) {
        throw new BadRequestError(`Cannot receive more than remaining quantity for product ${incoming.productId}.`);
      }
      target.receivedQuantity += toReceive;
      await target.save({ transaction });

      const [stock] = await StoreStock.findOrCreate({
        where: {
          tenantId: req.tenant.id,
          storeId: order.storeId,
          productId: target.productId
        },
        defaults: {
          tenantId: req.tenant.id,
          storeId: order.storeId,
          productId: target.productId,
          quantity: 0,
          createdBy: req.user.id,
          updatedBy: req.user.id
        },
        transaction
      });
      stock.quantity += toReceive;
      stock.lastReceivedAt = new Date();
      stock.updatedBy = req.user.id;
      await stock.save({ transaction });
    }

    const allReceived = order.items.every((item) => item.receivedQuantity >= item.quantity);
    const status = allReceived ? 'received' : 'partial';
    await order.update({
      status,
      receivedDate: receivedDate ? new Date(receivedDate) : allReceived ? new Date() : order.receivedDate,
      updatedBy: req.user.id
    }, { transaction });

    await transaction.commit();
    const refreshed = await PurchaseOrder.findOne({
      where: { id: order.id },
      include: [
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] }
      ]
    });
    res.json({ success: true, data: refreshed });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

module.exports = {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder
};
