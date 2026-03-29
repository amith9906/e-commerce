'use strict';
const { Tenant, User } = require('../../models');

// GET /api/super/tenants
const listTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: tenants });
  } catch (err) { next(err); }
};

// POST /api/super/tenants
const createTenant = async (req, res, next) => {
  try {
    const { name, slug, plan } = req.body;
    const tenant = await Tenant.create({ name, slug, plan, createdBy: req.user.id, updatedBy: req.user.id });
    res.status(201).json({ success: true, data: tenant });
  } catch (err) { next(err); }
};

// GET /api/super/tenants/:id
const getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, { include: [{ association: 'users', attributes: ['id', 'name', 'email', 'role'] }] });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
};

// PUT /api/super/tenants/:id
const updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });
    await tenant.update({ ...req.body, updatedBy: req.user.id });
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
};

// DELETE /api/super/tenants/:id
const deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });
    await tenant.update({ status: 'deleted', updatedBy: req.user.id });
    res.json({ success: true, message: 'Tenant marked as deleted.' });
  } catch (err) { next(err); }
};

// GET /api/super/analytics  (cross-tenant overview)
const platformAnalytics = async (req, res, next) => {
  try {
    const { Order, Payment, User: UserModel } = require('../../models');
    const { fn, col } = require('sequelize');
    const [totalTenants, activeUsers, totalOrders, totalRevenue] = await Promise.all([
      Tenant.count({ where: { status: 'active' } }),
      UserModel.count({ where: { role: 'customer' } }),
      Order.count(),
      Payment.sum('amount', { where: { status: 'success' } }),
    ]);
    res.json({ success: true, data: { totalTenants, activeUsers, totalOrders, totalRevenue: totalRevenue || 0 } });
  } catch (err) { next(err); }
};

module.exports = { listTenants, createTenant, getTenant, updateTenant, deleteTenant, platformAnalytics };
