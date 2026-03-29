'use strict';
const { Store, StoreStock, Product, InventoryTransfer, BillingRecord } = require('../../models');
const sequelize = require('../../config/database');

const resolveStore = async (tenantId, storeId) => {
  return Store.findOne({ where: { id: storeId, tenantId } });
};

const generateInvoiceNumber = () => `INV-${Date.now()}`;

// POST /api/transfers
const createTransfer = async (req, res, next) => {
  const { productId, fromStoreId, toStoreId, quantity, unitPrice, notes, paymentMethod, dueDate } = req.body;
  if (!productId || !toStoreId || !quantity) {
    return res.status(400).json({ success: false, message: 'productId, toStoreId, and quantity are required.' });
  }

  try {
    const [fromStore, toStore] = await Promise.all([
      fromStoreId ? resolveStore(req.tenant.id, fromStoreId) : null,
      resolveStore(req.tenant.id, toStoreId)
    ]);
    if (!toStore) return res.status(404).json({ success: false, message: 'Destination store not found.' });
    if (fromStoreId && !fromStore) {
      return res.status(404).json({ success: false, message: 'Source store not found.' });
    }
    if (fromStore && fromStore.id === toStore.id) {
      return res.status(400).json({ success: false, message: 'Source and destination store must differ.' });
    }

    const product = await Product.findOne({ where: { id: productId, tenantId: req.tenant.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    await sequelize.transaction(async (t) => {
      const transferUnitPrice = unitPrice !== undefined ? parseFloat(unitPrice) : parseFloat(product.price);
      const transferTotal = transferUnitPrice * quantity;

      if (fromStore) {
        const sourceStock = await StoreStock.findOne({
          where: { storeId: fromStore.id, productId, tenantId: req.tenant.id },
          lock: t.LOCK.UPDATE,
          transaction: t
        });
        if (!sourceStock || sourceStock.quantity < quantity) {
          throw new Error('Insufficient stock at source store.');
        }
        await sourceStock.update({
          quantity: sourceStock.quantity - quantity,
          updatedBy: req.user.id
        }, { transaction: t });
      }

      const [destinationStock, createdDestination] = await StoreStock.findOrCreate({
        where: { storeId: toStore.id, productId, tenantId: req.tenant.id },
        defaults: {
          quantity,
          lastReceivedAt: new Date(),
          createdBy: req.user.id,
          updatedBy: req.user.id
        },
        transaction: t
      });
      if (!createdDestination) {
        await destinationStock.update({
          quantity: (destinationStock.quantity || 0) + quantity,
          lastReceivedAt: new Date(),
          updatedBy: req.user.id
        }, { transaction: t });
      }

      const transfer = await InventoryTransfer.create({
        tenantId: req.tenant.id,
        productId,
        fromStoreId: fromStore ? fromStore.id : null,
        toStoreId: toStore.id,
        quantity,
        unitPrice: transferUnitPrice,
        totalAmount: transferTotal,
        salesPersonId: req.user.role === 'salesperson' ? req.user.id : null,
        status: 'shipped',
        referenceInvoice: generateInvoiceNumber(),
        notes,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      await BillingRecord.create({
        tenantId: req.tenant.id,
        storeId: toStore.id,
        transferId: transfer.id,
        invoiceNumber: transfer.referenceInvoice,
        amount: transferTotal,
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'cash',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      res.status(201).json({ success: true, data: transfer });
    });
  } catch (err) {
    if (err.message.includes('Insufficient stock')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// GET /api/transfers
const listTransfers = async (req, res, next) => {
  try {
    const { storeId, salesPersonId, status, page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;
    const where = { tenantId: req.tenant.id };
    if (storeId) where.toStoreId = storeId;
    if (salesPersonId) where.salesPersonId = salesPersonId;
    if (status) where.status = status;

    const transfers = await InventoryTransfer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        { association: 'product', attributes: ['name', 'sku'] },
        { association: 'sourceStore', attributes: ['id', 'name'] },
        { association: 'destinationStore', attributes: ['id', 'name'] },
        { association: 'salesPerson', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      success: true,
      data: transfers.rows,
      pagination: { total: transfers.count, page: parseInt(page), pages: Math.ceil(transfers.count / limit) }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/transfers/:id
const getTransfer = async (req, res, next) => {
  try {
    const transfer = await InventoryTransfer.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: [
        { association: 'product', attributes: ['name', 'sku'] },
        { association: 'sourceStore', attributes: ['id', 'name'] },
        { association: 'destinationStore', attributes: ['id', 'name'] },
        { association: 'salesPerson', attributes: ['id', 'name', 'email'] }
      ]
    });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found.' });
    res.json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transfers/:id/status
const updateTransferStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const transfer = await InventoryTransfer.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found.' });

    await transfer.update({ status, updatedBy: req.user.id });
    res.json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTransfer, listTransfers, getTransfer, updateTransferStatus };
