'use strict';
const { Op } = require('sequelize');
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

const heroPromotions = async (req, res, next) => {
  try {
    const now = new Date();
    const where = {
      tenantId: req.tenant.id,
      isActive: true,
      [Op.or]: [
        { valid_from: null, valid_to: null },
        { valid_from: { [Op.lte]: now }, valid_to: { [Op.gte]: now } },
        { valid_from: { [Op.lte]: now }, valid_to: null },
        { valid_from: null, valid_to: { [Op.gte]: now } },
      ],
    };

    const promotions = await Promotion.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 3,
    });

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

// PATCH /api/promotions/:id (Admin)
const updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findOne({ where: { id: req.params.id, tenantId: req.tenant.id } });
    if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found.' });
    await promotion.update({ ...req.body, updatedBy: req.user.id });
    res.json({ success: true, data: promotion });
  } catch (err) { next(err); }
};

// DELETE /api/promotions/:id (Admin)
const deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findOne({ where: { id: req.params.id, tenantId: req.tenant.id } });
    if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found.' });
    await promotion.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { listPromotions, createPromotion, heroPromotions, updatePromotion, deletePromotion };
