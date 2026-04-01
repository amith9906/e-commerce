'use strict';
const { BackInStockAlert, Product, Notification } = require('../../models');
const { sendEmail } = require('../../utils/mailer');
const { emitNotificationEvent } = require('../../utils/notificationEmitter');

const subscribeBackInStock = async (req, res, next) => {
  try {
    const { productId, email, note } = req.body;
    const userId = req.user?.id || null;

    if (!productId || !email) {
      return res.status(400).json({ success: false, message: 'Product ID and email are required.' });
    }

    const product = await Product.findOne({ where: { id: productId, tenantId: req.tenant.id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const [alert, created] = await BackInStockAlert.findOrCreate({
      where: { tenantId: req.tenant.id, productId, email },
      defaults: {
        userId,
        status: 'pending',
        note,
        createdBy: userId,
        updatedBy: userId
      }
    });

    if (!created && alert.status === 'pending') {
      return res.json({ success: true, message: 'You are already signed up for restock alerts.' });
    }

    if (!created) {
      await alert.update({
        status: 'pending',
        notifiedAt: null,
        note,
        updatedBy: userId
      });
    }

    res.json({ success: true, message: 'We will notify you when the item is back in stock.' });
  } catch (err) {
    next(err);
  }
};

const listAlertsForAdmin = async (req, res, next) => {
  try {
    const alerts = await BackInStockAlert.findAll({
      where: { tenantId: req.tenant.id },
      include: [
        { association: 'product', attributes: ['id', 'name', 'slug'] },
        { association: 'user', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

const cancelAlert = async (req, res, next) => {
  try {
    const alert = await BackInStockAlert.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id, userId: req.user?.id || null }
    });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }
    await alert.update({ status: 'cancelled', updatedBy: req.user?.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { subscribeBackInStock, listAlertsForAdmin, cancelAlert };
