'use strict';
const { Stock, Product, BackInStockAlert, Notification } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const { sendEmail } = require('../../utils/mailer');
const { emitNotificationEvent } = require('../../utils/notificationEmitter');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const notifyBackInStockSubscribers = async ({ tenantId, productId, productName, tenantName, triggeredBy }) => {
  const alerts = await BackInStockAlert.findAll({
    where: { tenantId, productId, status: 'pending' }
  });
  if (!alerts.length) return;

  await Promise.all(alerts.map(async (alert) => {
    const subject = `${productName} is back in stock!`;
    const message = `${productName} is now back in stock at ${tenantName}. Order now before it sells out again.`;
    await sendEmail(alert.email, subject, message, `<p>${message}</p>`);

    if (alert.userId) {
      const notification = await Notification.create({
        tenantId,
        userId: alert.userId,
        title: 'Product back in stock',
        message: `${productName} is available again.`,
        type: 'info',
        referenceId: productId,
        createdBy: triggeredBy,
        updatedBy: triggeredBy
      });
      emitNotificationEvent(notification.toJSON ? notification.toJSON() : notification);
    }

    await alert.update({
      status: 'notified',
      notifiedAt: new Date(),
      updatedBy: triggeredBy
    });
  }));
};

// GET /api/stock (Admin)
const getStock = async (req, res, next) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const { q, status } = req.query;
    const where = { tenantId: req.tenant.id };
    const andConditions = [];
    if (q) {
      andConditions.push(Sequelize.where(Sequelize.col('product.name'), { [Op.iLike]: `%${q}%` }));
    }
    if (status === 'low') {
      andConditions.push(Sequelize.where(Sequelize.col('quantity'), '<=', Sequelize.col('low_stock_threshold')));
    } else if (status === 'out') {
      andConditions.push({ quantity: { [Op.lte]: 0 } });
    } else if (status === 'in_stock') {
      andConditions.push(Sequelize.where(Sequelize.col('quantity'), '>', Sequelize.col('low_stock_threshold')));
    }
    if (andConditions.length) {
      where[Op.and] = andConditions;
    }
    const { count, rows } = await Stock.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'category', 'images', 'isActive'] }
      ],
      order: [['quantity', 'ASC']], // low stock first
      limit,
      offset
    });
    res.json({
      success: true,
      data: rows,
      pagination: buildPaginationMeta(count, { page, limit })
    });
  } catch (err) { next(err); }
};

// PUT /api/stock/:productId (Admin)
const updateStock = async (req, res, next) => {
  try {
    const { quantity, lowStockThreshold } = req.body;
    const product = await Product.findOne({ where: { id: req.params.productId, tenantId: req.tenant.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    let stock = await Stock.findOne({ where: { productId: req.params.productId, tenantId: req.tenant.id } });
    const prevQuantity = stock?.quantity ?? 0;

    if (!stock) {
      // Create if doesn't exist for some reason
      stock = await Stock.create({
        productId: req.params.productId,
        tenantId: req.tenant.id,
        quantity: quantity || 0,
        lowStockThreshold: lowStockThreshold || 5,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
    } else {
      const updates = { updatedBy: req.user.id };
      if (quantity !== undefined) updates.quantity = quantity;
      if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;
      await stock.update(updates);
    }

    const newQuantity = stock.quantity;
    if (prevQuantity <= 0 && newQuantity > 0) {
      await notifyBackInStockSubscribers({
        tenantId: req.tenant.id,
        productId: req.params.productId,
        productName: product.name || 'Your item',
        tenantName: req.tenant.name || 'our store',
        triggeredBy: req.user.id
      });
    }

    res.json({ success: true, data: stock });
  } catch (err) { next(err); }
};

module.exports = { getStock, updateStock };

