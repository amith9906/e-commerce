'use strict';
const { Promotion } = require('../../models');

// GET /api/promotions
const listPromotions = async (req, res, next) => {
  try {
    const where = { tenantId: req.tenant.id };
    if (req.user.role === 'customer') where.isActive = true;
    const promotions = await Promotion.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: promotions });
  } catch (err) { next(err); }
};

// POST /api/promotions (Admin)
const createPromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.create({
      ...req.body,
      tenantId: req.tenant.id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    res.status(201).json({ success: true, data: promotion });
  } catch (err) { next(err); }
};

module.exports = { listPromotions, createPromotion };
