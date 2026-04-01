'use strict';
const { Payment, Order, Tenant } = require('../../models');
const PaymentGatewayFactory = require('./paymentGateway.factory');

// GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;

    const includeOrder = req.user.role === 'customer' 
      ? { model: Order, as: 'order', where: { userId: req.user.id }, attributes: ['id', 'totalAmount'] }
      : { model: Order, as: 'order', attributes: ['id', 'totalAmount', 'userId'] };

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [includeOrder],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const sanitizedRows = rows.map(payment => {
      const p = payment.toJSON();
      if (p.metadata) {
        // Only return non-sensitive fields to the frontend
        const { gatewayResponse, ...safeMetadata } = p.metadata;
        p.metadata = safeMetadata;
      }
      return p;
    });

    res.json({ success: true, data: sanitizedRows, pagination: { total: count, page, pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

/**
 * Initialize a payment intent/session with the tenant's chosen gateway
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findOne({ where: { id: paymentId, tenantId: req.tenant.id, status: 'pending' } });
    if (!payment) return res.status(404).json({ success: false, message: 'Pending payment record not found.' });

    const tenant = await Tenant.findByPk(req.tenant.id);
    const driver = PaymentGatewayFactory.getDriver(tenant.settings || {});
    
    const intent = await driver.createIntent(payment, tenant.settings || {});
    res.json({ success: true, data: intent });
  } catch (err) { next(err); }
};

/**
 * Mark payment as success (Webhooks would normally handle this, but keeping it for manual/mock overrides)
 */
const confirmPaymentResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionRef, gatewayResponse } = req.body;
    
    const payment = await Payment.findOne({ where: { id, tenantId: req.tenant.id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    await payment.update({ 
      status: 'success', 
      transactionRef: transactionRef || `REF-${Date.now()}`,
      metadata: { ...payment.metadata, gatewayResponse },
      updatedBy: req.user.id 
    });

    await Order.update({ status: 'confirmed' }, { where: { id: payment.orderId } });
    res.json({ success: true, message: 'Payment confirmed and order updated.' });
  } catch (err) { next(err); }
};

/**
 * Process a refund for an existing payment
 */
const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ where: { id, tenantId: req.tenant.id, status: 'success' } });
    if (!payment) return res.status(404).json({ success: false, message: 'Successful payment not found for refund.' });

    const tenant = await Tenant.findByPk(req.tenant.id);
    const driver = PaymentGatewayFactory.getDriver(tenant.settings || {});
    
    const refundResult = await driver.processRefund(payment, tenant.settings || {});
    if (refundResult.success) {
      await payment.update({ status: 'refunded', refundId: refundResult.refundId });
      res.json({ success: true, message: 'Refund processed successfully.', data: refundResult });
    } else {
      res.status(400).json({ success: false, message: refundResult.message || 'Gateway refund failed.' });
    }
  } catch (err) { next(err); }
};

module.exports = { getPayments, createPaymentIntent, confirmPaymentResult, processRefund };
