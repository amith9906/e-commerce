'use strict';
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, UserAddress, ProductView, Product } = require('../../models');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

// GET /api/users
// Admin: list users in their tenant
const listUsers = async (req, res, next) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const { q, role, status } = req.query;
    const where = { tenantId: req.tenant.id };
    if (role) where.role = role;
    if (status === 'verified') where.isVerified = true;
    else if (status === 'unverified') where.isVerified = false;
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: UserAddress, as: 'addresses', limit: 1 }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const paginationMeta = buildPaginationMeta(count, { page, limit });

    res.json({ 
      success: true, 
      data: rows,
      pagination: paginationMeta
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
    const { name, phone, age, gender } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (age !== undefined && age !== null && age !== '') updates.age = Number(age);
    if (gender !== undefined) updates.gender = gender;

    await user.update({ ...updates, updatedBy: req.user.id });
    const userJson = user.toJSON();
    delete userJson.passwordHash;
    res.json({ success: true, data: userJson });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash, updatedBy: req.user.id });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const address = await UserAddress.findOne({
      where: { id, userId: req.user.id, tenantId: req.tenant.id },
    });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });

    const payload = req.body || {};
    if (payload.isDefault) {
      await UserAddress.update({ isDefault: false }, {
        where: { userId: req.user.id, tenantId: req.tenant.id },
      });
    }

    await address.update({ ...payload, updatedBy: req.user.id });
    res.json({ success: true, data: address });
  } catch (err) { next(err); }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await UserAddress.destroy({
      where: { id, userId: req.user.id, tenantId: req.tenant.id },
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Address not found.' });
    res.json({ success: true, message: 'Address deleted.' });
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

module.exports = {
  listUsers,
  getProfile,
  updateProfile,
  addAddress,
  getUserViews,
  changePassword,
  updateAddress,
  deleteAddress,
};
