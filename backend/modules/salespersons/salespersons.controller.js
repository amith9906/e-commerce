'use strict';
const { SalesPersonAssignment, InventoryTransfer, BillingRecord, DeliveryLog } = require('../../models');
const { Op } = require('sequelize');
const upload = require('../../middleware/upload');
const { uploadToS3 } = require('../../utils/s3Upload');

const getAssignments = async (req, res, next) => {
  try {
    const assignments = await SalesPersonAssignment.findAll({
      where: { tenantId: req.tenant.id, userId: req.user.id },
      include: [{ association: 'store', attributes: ['id', 'name', 'address', 'contact_phone', 'status'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
};

const attachDeliveryProof = async (req, res, next) => {
  try {
    const transfer = await InventoryTransfer.findOne({
      where: { id: req.params.transferId, tenantId: req.tenant.id, salesPersonId: req.user.id }
    });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found.' });

    const deliveryLog = await DeliveryLog.findOne({ where: { transferId: transfer.id, tenantId: req.tenant.id } });
    if (!deliveryLog) {
      return res.status(404).json({ success: false, message: 'Delivery log not found.' });
    }

    const updates = { updatedBy: req.user.id };
    if (req.file) {
      const uploadedUrl = await uploadToS3(req.file.buffer, req.file.mimetype, 'delivery-proofs');
      updates.proofUrl = uploadedUrl;
    }
    if (req.body.latitude) updates.latitude = req.body.latitude;
    if (req.body.longitude) updates.longitude = req.body.longitude;
    if (req.body.signatureUrl) updates.signatureUrl = req.body.signatureUrl;

    await deliveryLog.update(updates);
    res.json({ success: true, data: deliveryLog });
  } catch (err) {
    next(err);
  }
};

const getPendingTransfers = async (req, res, next) => {
  try {
    const transfers = await InventoryTransfer.findAll({
      where: { tenantId: req.tenant.id, salesPersonId: req.user.id, status: { [Op.ne]: 'delivered' } },
      include: [
        { association: 'product', attributes: ['id', 'name', 'sku'] },
        { association: 'destinationStore', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: transfers });
  } catch (err) {
    next(err);
  }
};

const logDelivery = async (req, res, next) => {
  try {
    const transfer = await InventoryTransfer.findOne({
      where: { id: req.params.transferId, tenantId: req.tenant.id, salesPersonId: req.user.id }
    });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found.' });

    await transfer.update({ status: 'delivered', updatedBy: req.user.id });
    await DeliveryLog.create({
      tenantId: req.tenant.id,
      transferId: transfer.id,
      salesPersonId: req.user.id,
      status: 'delivered',
      notes: req.body.notes || null,
      location: req.body.location || null,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
};

const getKpi = async (req, res, next) => {
  try {
    const totalTransfers = await InventoryTransfer.count({
      where: { tenantId: req.tenant.id, salesPersonId: req.user.id }
    });
    const totalUnits = await InventoryTransfer.sum('quantity', {
      where: { tenantId: req.tenant.id, salesPersonId: req.user.id }
    });
    const totalRevenue = await InventoryTransfer.sum('totalAmount', {
      where: { tenantId: req.tenant.id, salesPersonId: req.user.id }
    });
    const pendingInvoices = await BillingRecord.count({
      where: { tenantId: req.tenant.id, paymentStatus: 'pending' },
      include: [{
        model: InventoryTransfer,
        as: 'transfer',
        where: { salesPersonId: req.user.id },
        required: true
      }]
    });

    res.json({
      success: true,
      data: {
        totalTransfers,
        totalUnits: totalUnits || 0,
        totalRevenue: totalRevenue || 0,
        pendingInvoices
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAssignments, getPendingTransfers, logDelivery, getKpi, attachDeliveryProof };
