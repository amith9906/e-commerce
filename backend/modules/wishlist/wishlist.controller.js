'use strict';
const { WishlistItem, Product } = require('../../models');

const getWishlist = async (req, res, next) => {
  try {
    const items = await WishlistItem.findAll({
      where: { tenantId: req.tenant.id, userId: req.user.id },
      include: [{ association: 'product', attributes: ['id', 'name', 'price', 'images', 'brand'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required.' });

    const existing = await WishlistItem.findOne({ where: { tenantId: req.tenant.id, userId: req.user.id, productId } });
    if (existing) return res.status(200).json({ success: true, data: existing, message: 'Already on wishlist.' });

    const item = await WishlistItem.create({ tenantId: req.tenant.id, userId: req.user.id, productId, createdBy: req.user.id, updatedBy: req.user.id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const destroyed = await WishlistItem.destroy({ where: { id: req.params.id, tenantId: req.tenant.id, userId: req.user.id } });
    if (!destroyed) return res.status(404).json({ success: false, message: 'Wishlist item not found.' });
    res.json({ success: true, message: 'Item removed from wishlist.' });
  } catch (err) { next(err); }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
