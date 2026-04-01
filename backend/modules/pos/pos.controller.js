'use strict';
const { POSReceipt, POSReceiptItem, Store, Product, StoreStock, User } = require('../../models');
const sequelize = require('../../config/database');

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.status = 400;
  }
}

const STATUS_VALUES = ['pending', 'paid', 'cancelled'];

const buildLineItemTotals = (item, defaultTaxRate) => {
  const quantity = Math.max(0, Number(item.quantity) || 0);
  if (quantity <= 0) {
    throw new BadRequestError('Each POS line item must include a quantity greater than zero.');
  }
  const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
  const discountAmount = Math.max(0, Number(item.discountAmount) || 0);
  const taxRate = Number(item.taxRate ?? defaultTaxRate ?? 0);
  const gross = quantity * unitPrice;
  const net = Math.max(0, gross - discountAmount);
  const taxAmount = (net * taxRate) / 100;
  const lineTotal = net + taxAmount;
  return { quantity, unitPrice, discountAmount, taxRate, taxAmount, lineTotal };
};

const listReceipts = async (req, res, next) => {
  try {
    const where = { tenantId: req.tenant.id };
    if (req.query.status) where.status = req.query.status;
    if (req.query.storeId) where.storeId = req.query.storeId;
    if (req.user.role === 'salesperson') {
      where.salespersonId = req.user.id;
    }
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const { count, rows } = await POSReceipt.findAndCountAll({
      where,
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name'] },
        { model: User, as: 'salesperson', attributes: ['id', 'name'] },
        {
          model: POSReceiptItem,
          as: 'items',
          attributes: ['id', 'productId', 'quantity', 'lineTotal'],
          include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({ success: true, data: rows, total: count });
  } catch (err) {
    next(err);
  }
};

const getReceipt = async (req, res, next) => {
  try {
    const receipt = await POSReceipt.findOne({
      where: { id: req.params.receiptId, tenantId: req.tenant.id },
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name'] },
        { model: User, as: 'salesperson', attributes: ['id', 'name', 'email'] },
        {
          model: POSReceiptItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    res.json({ success: true, data: receipt });
  } catch (err) {
    next(err);
  }
};

const createReceipt = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      storeId,
      salespersonId,
      items = [],
      currency,
      paymentMethod,
      paidAmount,
      notes,
      status
    } = req.body;

    if (!storeId) throw new BadRequestError('Store is required for POS receipts.');
    if (!Array.isArray(items) || !items.length) throw new BadRequestError('At least one line item is required.');

    const store = await Store.findOne({ where: { id: storeId, tenantId: req.tenant.id } });
    if (!store) throw new BadRequestError('Store not found.');

    let salesperson = null;
    if (salespersonId) {
      salesperson = await User.findOne({ where: { id: salespersonId, tenantId: req.tenant.id } });
      if (!salesperson) throw new BadRequestError('Salesperson not found.');
    }

    const tenantCurrency = req.tenant?.settings?.currency || 'INR';
    const defaultTaxRate = Number(req.tenant?.settings?.taxRate || 0);
    const receipt = await POSReceipt.create({
      tenantId: req.tenant.id,
      storeId: store.id,
      salespersonId: salesperson?.id || null,
      status: status && STATUS_VALUES.includes(status) ? status : 'pending',
      currency: currency || tenantCurrency,
      paymentMethod: paymentMethod || null,
      paidAmount: Number(paidAmount || 0),
      notes: notes || null,
      createdBy: req.user.id,
      updatedBy: req.user.id
    }, { transaction });

    let totalAmount = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const receiptItems = [];

    for (const item of items) {
      const { quantity, unitPrice, discountAmount, taxRate, taxAmount, lineTotal } = buildLineItemTotals(item, defaultTaxRate);
      if (!item.productId) throw new BadRequestError('Product is required for each line item.');
      const product = await Product.findOne({ where: { id: item.productId, tenantId: req.tenant.id } });
      if (!product) throw new BadRequestError("Product not found.");

      receiptItems.push({
        posReceiptId: receipt.id,
        productId: product.id,
        quantity,
        unitPrice,
        discountAmount,
        taxRate,
        taxAmount,
        lineTotal,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });

      totalAmount += lineTotal;
      totalTax += taxAmount;
      totalDiscount += discountAmount;

      const [stock] = await StoreStock.findOrCreate({
        where: {
          tenantId: req.tenant.id,
          storeId: store.id,
          productId: product.id
        },
        defaults: {
          tenantId: req.tenant.id,
          storeId: store.id,
          productId: product.id,
          quantity: 0,
          lowStockThreshold: 5,
          createdBy: req.user.id,
          updatedBy: req.user.id
        },
        transaction
      });

      stock.quantity -= quantity;
      stock.updatedBy = req.user.id;
      await stock.save({ transaction });
    }

    await POSReceiptItem.bulkCreate(receiptItems, { transaction });
    await receipt.update({ totalAmount, taxAmount: totalTax, discountAmount: totalDiscount }, { transaction });
    await transaction.commit();

    const created = await POSReceipt.findOne({
      where: { id: receipt.id },
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name'] },
        { model: User, as: 'salesperson', attributes: ['id', 'name', 'email'] },
        {
          model: POSReceiptItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await POSReceipt.findOne({ where: { id: req.params.receiptId, tenantId: req.tenant.id } });
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    const updates = {};
    if (req.body.status) {
      if (!STATUS_VALUES.includes(req.body.status)) {
        throw new BadRequestError('Invalid status provided.');
      }
      updates.status = req.body.status;
    }
    ['notes', 'paymentMethod', 'currency'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (req.body.paidAmount !== undefined) {
      const amount = Number(req.body.paidAmount);
      if (Number.isNaN(amount) || amount < 0) {
        throw new BadRequestError('paidAmount must be a positive number.');
      }
      updates.paidAmount = amount;
    }

    if (req.body.salespersonId) {
      const salesperson = await User.findOne({ where: { id: req.body.salespersonId, tenantId: req.tenant.id } });
      if (!salesperson) {
        throw new BadRequestError('Salesperson not found.');
      }
      updates.salespersonId = salesperson.id;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    updates.updatedBy = req.user.id;
    await receipt.update(updates);
    res.json({ success: true, data: receipt });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listReceipts,
  getReceipt,
  createReceipt,
  updateReceipt
};
