'use strict';
const { Payment, Order } = require('../../models');

// GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenantId: req.tenant.id };
    if (req.user.role === 'customer') {
      // Find orders for user, then payments for those orders
      // For simplicity, just joining with Order
    }
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

    res.json({ success: true, data: rows, pagination: { total: count, page, pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

// POST /api/payments/:id/mock-success
// Mock endpoint to simulate payment gateway webhook success
const mockPaymentSuccess = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ where: { id: req.params.id, tenantId: req.tenant.id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    await payment.update({ 
      status: 'success', 
      transactionRef: `MOCK-${Date.now()}`,
      updatedBy: req.user.id 
    });

    // Update order status
    const order = await Order.findByPk(payment.orderId);
    if (order) await order.update({ status: 'confirmed', updatedBy: req.user.id });

    res.json({ success: true, data: payment, message: 'Payment marked as success. Order confirmed.' });
  } catch (err) { next(err); }
};

module.exports = { getPayments, mockPaymentSuccess };
