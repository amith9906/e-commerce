'use strict';
const { CartItem, Product, CartRecoveryToken, User } = require('../../models');
const { runCartRecovery } = require('../../services/cartRecoveryService');

const getCart = async (req, res, next) => {
  try {
    const items = await CartItem.findAll({
      where: { tenantId: req.tenant.id, userId: req.user.id },
      include: [{ association: 'product', attributes: ['id', 'name', 'price', 'images', 'brand', 'availableSizes', 'availableColors'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

const upsertCartItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size = null, color = null } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required.' });

    const normalizedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const where = { tenantId: req.tenant.id, userId: req.user.id, productId, size, color };

    let item = await CartItem.findOne({ where });
    if (item) {
      item = await item.update({ quantity: item.quantity + normalizedQty, updatedBy: req.user.id });
    } else {
      item = await CartItem.create({ ...where, quantity: normalizedQty, createdBy: req.user.id, updatedBy: req.user.id });
    }

    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await CartItem.findOne({ where: { id: req.params.id, tenantId: req.tenant.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    const updated = await item.update({ quantity: parseInt(quantity, 10), updatedBy: req.user.id });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const removeCartItem = async (req, res, next) => {
  try {
    const destroyed = await CartItem.destroy({ where: { id: req.params.id, tenantId: req.tenant.id, userId: req.user.id } });
    if (!destroyed) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    res.json({ success: true, message: 'Item removed.' });
  } catch (err) { next(err); }
};

const recoverCart = async (req, res, next) => {
  try {
    const token = req.params.token;
    const now = new Date();
    const record = await CartRecoveryToken.findOne({ where: { token, tenantId: req.tenant.id } });
    if (!record) return res.status(404).json({ success: false, message: 'Recovery link not found.' });
    if (record.status === 'claimed') {
      return res.status(410).json({ success: false, message: 'Recovery link already used.' });
    }
    if (record.expiresAt < now) {
      await record.update({ status: 'expired', updatedBy: req.user?.id || null });
      return res.status(410).json({ success: false, message: 'Recovery link expired.' });
    }

    const items = await CartItem.findAll({
      where: { tenantId: req.tenant.id, userId: record.userId },
      include: [{ association: 'product', attributes: ['id', 'name', 'price', 'images'] }],
      order: [['created_at', 'DESC']]
    });

    await record.update({ status: 'claimed', updatedBy: req.user?.id || null });
    res.json({ success: true, data: { items, userId: record.userId, expiresAt: record.expiresAt } });
  } catch (err) {
    next(err);
  }
};

const buildCartRecoveryOverview = async (tenantId) => {
  const [sent, claimed, expired] = await Promise.all([
    CartRecoveryToken.count({ where: { tenantId, status: 'sent' } }),
    CartRecoveryToken.count({ where: { tenantId, status: 'claimed' } }),
    CartRecoveryToken.count({ where: { tenantId, status: 'expired' } })
  ]);

  const pending = await CartRecoveryToken.findAll({
    where: { tenantId, status: 'sent' },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'DESC']],
    limit: 5
  });

  return {
    counts: { sent, claimed, expired },
    pending: pending.map((token) => ({
      id: token.id,
      userId: token.userId,
      userName: token.user?.name || token.user?.email,
      userEmail: token.user?.email,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt
    }))
  };
};

const getCartRecoverySummary = async (req, res, next) => {
  try {
    const overview = await buildCartRecoveryOverview(req.tenant.id);
    res.json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
};

const triggerCartRecovery = async (req, res, next) => {
  try {
    const job = await runCartRecovery({ tenantId: req.tenant.id });
    const overview = await buildCartRecoveryOverview(req.tenant.id);
    res.json({ success: true, data: { job, overview } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  upsertCartItem,
  updateCartItem,
  removeCartItem,
  recoverCart,
  getCartRecoverySummary,
  triggerCartRecovery
};
