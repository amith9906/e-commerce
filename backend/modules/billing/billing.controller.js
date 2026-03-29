'use strict';
const { BillingRecord, Store, InventoryTransfer, Product, User } = require('../../models');
const { Op } = require('sequelize');
const { fn, col } = require('sequelize');
const { createInvoiceNumber } = require('../../utils/invoiceTemplate');

// GET /api/billing
const listBillingRecords = async (req, res, next) => {
  try {
    const { storeId, invoiceNumber, status, page = 1, limit = 25 } = req.query;
    const where = { tenantId: req.tenant.id };
    if (storeId) where.storeId = storeId;
    if (invoiceNumber) where.invoiceNumber = invoiceNumber;
    if (status) where.paymentStatus = status;

    const offset = (page - 1) * limit;
    const records = await BillingRecord.findAndCountAll({
      where,
      include: [{ association: 'store', attributes: ['name', 'contact_phone'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: records.rows,
      pagination: { total: records.count, page: parseInt(page), pages: Math.ceil(records.count / limit) }
    });
  } catch (err) {
    next(err);
  }
};

const createManualBilling = async (req, res, next) => {
  try {
    const { storeId, amount, paymentStatus = 'pending', paymentMethod = 'cash', dueDate, notes, transferId } = req.body;

    if (!storeId || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'storeId and amount are required.' });
    }

    const store = await Store.findOne({ where: { id: storeId, tenantId: req.tenant.id } });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    const billing = await BillingRecord.create({
      tenantId: req.tenant.id,
      storeId: store.id,
      transferId: transferId || null,
      invoiceNumber: createInvoiceNumber(),
      amount: Number(amount),
      paymentStatus,
      paymentMethod,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: billing });
  } catch (err) {
    next(err);
  }
};

const getBillingInvoice = async (req, res, next) => {
  try {
    const record = await BillingRecord.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: [
        { association: 'store', attributes: ['id', 'name', 'contact_phone'] },
        {
          association: 'transfer',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }, { model: User, as: 'salesPerson', attributes: ['id', 'name', 'email'] }]
        }
      ]
    });
    if (!record) return res.status(404).json({ success: false, message: 'Billing record not found.' });

    const filename = `invoice-${record.invoiceNumber || record.id}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const exportBillingRecords = async (req, res, next) => {
  try {
    const { storeId, status } = req.query;
    const where = { tenantId: req.tenant.id };
    if (storeId) where.storeId = storeId;
    if (status) where.paymentStatus = status;

    const records = await BillingRecord.findAll({
      where,
      include: [{ association: 'store', attributes: ['name'] }],
      order: [['due_date', 'ASC']]
    });

    const header = ['Invoice Number', 'Store', 'Amount', 'Payment Status', 'Due Date'];
    const rows = records.map((record) => [
      record.invoiceNumber || record.id,
      record.store?.name || 'Unknown store',
      record.amount?.toString() || '0',
      record.paymentStatus,
      record.dueDate ? record.dueDate.toISOString().split('T')[0] : 'N/A'
    ]);
    const csvContent = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="billing-export.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

// GET /api/billing/store-revenue
const getStoreRevenue = async (req, res, next) => {
  try {
    const revenue = await BillingRecord.findAll({
      attributes: [
        'store_id',
        [fn('SUM', col('amount')), 'totalRevenue']
      ],
      where: { tenantId: req.tenant.id },
      group: ['store_id', 'store.id', 'store.name'],
      include: [{ association: 'store', attributes: ['name'] }]
    });
    res.json({ success: true, data: revenue });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/billing/:id/payment-status
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    const record = await BillingRecord.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Billing record not found.' });

    await record.update({ paymentStatus, updatedBy: req.user.id });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

module.exports = { listBillingRecords, createManualBilling, getBillingInvoice, exportBillingRecords, getStoreRevenue, updatePaymentStatus };
