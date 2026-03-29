'use strict';
const { User, UserAddress, ProductView, Product } = require('../../models');

// GET /api/users
// Admin: list users in their tenant
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { tenantId: req.tenant.id },
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: UserAddress, as: 'addresses', limit: 1 }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ 
      success: true, 
      data: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) }
    });
  } catch (err) { next(err); }
};

// GET /api/users/me
// Customer/Admin: get own profile + addresses
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: UserAddress,
        as: 'addresses'
      }]
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/me
// Customer/Admin: update own profile
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    await user.update({ name, updatedBy: req.user.id });
    const userJson = user.toJSON();
    delete userJson.passwordHash;
    res.json({ success: true, data: userJson });
  } catch (err) { next(err); }
};

// POST /api/users/addresses
// Customer: add new address
const addAddress = async (req, res, next) => {
  try {
    // If this is the first address or set to default, make it default and reset others 
    const isFirst = await UserAddress.count({ where: { userId: req.user.id, tenantId: req.tenant.id } }) === 0;
    const isDefault = req.body.isDefault || isFirst;

    if (isDefault) {
      await UserAddress.update({ isDefault: false }, { where: { userId: req.user.id, tenantId: req.tenant.id } });
    }

    const address = await UserAddress.create({
      ...req.body,
      isDefault,
      userId: req.user.id,
      tenantId: req.tenant.id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: address });
  } catch (err) { next(err); }
};

// GET /api/users/:id/views (Admin only)
// Admin: See what products a specific user has viewed
const getUserViews = async (req, res, next) => {
  try {
    const views = await ProductView.findAll({
      where: { userId: req.params.id, tenantId: req.tenant.id },
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'category', 'imageUrl'] }],
      order: [['viewed_at', 'DESC']],
      limit: 20
    });
    res.json({ success: true, data: views });
  } catch (err) { next(err); }
};

module.exports = { listUsers, getProfile, updateProfile, addAddress, getUserViews };
