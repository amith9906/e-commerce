'use strict';
const { Notification } = require('../../models');

// GET /api/notifications
// Admin/Customer: list own notifications + broadcasts
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Postgres specific: user_id = req.user.id OR user_id IS NULL (broadcast)
    const { Op } = require('sequelize');
    const where = {
      tenantId: req.tenant.id,
      [Op.or]: [{ userId: req.user.id }, { userId: null }]
    };

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ success: true, data: rows, pagination: { total: count, page, pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id, userId: req.user.id }
    });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    await notification.update({ isRead: true, updatedBy: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// POST /api/notifications/broadcast (Admin)
const broadcast = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    const notification = await Notification.create({
      tenantId: req.tenant.id,
      userId: null, // null means broadcast to all users in this tenant
      title,
      message,
      type: type || 'info',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    res.status(201).json({ success: true, data: notification });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAsRead, broadcast };
