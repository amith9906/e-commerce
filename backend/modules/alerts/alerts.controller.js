'use strict';
const { StoreStock, Store, BillingRecord, DeliveryLog } = require('../../models');
const { Sequelize, Op } = require('sequelize');

const getLowStockAlerts = async (req, res, next) => {
  try {
    const alerts = await StoreStock.findAll({
      where: Sequelize.where(
        Sequelize.col('quantity'),
        '<=',
        Sequelize.col('low_stock_threshold')
      ),
    include: [
      { association: 'store', attributes: ['id', 'name', 'contact_phone', 'status'] },
      { association: 'product', attributes: ['id', 'name'] }
    ],
      order: [['quantity', 'ASC']],
      limit: 25
    });
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

const getInvoiceAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const alerts = await BillingRecord.findAll({
      where: {
        tenantId: req.tenant.id,
        paymentStatus: { [Op.in]: ['pending', 'partial'] },
        dueDate: { [Op.lt]: now }
      },
      include: [{ association: 'store', attributes: ['id', 'name'] }],
      order: [['due_date', 'ASC']],
      limit: 25
    });
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

const getDeliveryProofAlerts = async (req, res, next) => {
  try {
    const threshold = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours
    const alerts = await DeliveryLog.findAll({
      where: {
        tenantId: req.tenant.id,
        status: 'delivered',
        proofUrl: null,
        created_at: { [Op.lt]: threshold }
      },
      include: [
        { association: 'transfer', include: [{ association: 'product', attributes: ['name'] }, { association: 'destinationStore', attributes: ['name'] }] },
        { association: 'salesPerson', attributes: ['name', 'email'] }
      ],
      order: [['created_at', 'ASC']],
      limit: 20
    });
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLowStockAlerts, getInvoiceAlerts, getDeliveryProofAlerts };
