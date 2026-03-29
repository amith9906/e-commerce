'use strict';
const { BillingRecord, Store } = require('../../models');
const { fn, col } = require('sequelize');

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

module.exports = { listBillingRecords, getStoreRevenue, updatePaymentStatus };
