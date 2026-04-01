'use strict';
const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const dayjs = require('dayjs');
const { Tenant, User, Order, Payment, Subscription } = require('../../models');
const { PLANS } = require('../../config/plans');

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
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [{ association: 'users', attributes: ['id', 'name', 'email', 'role'] }],
    });
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

// GET /api/super/tenants/analytics
const platformAnalytics = async (req, res, next) => {
  try {
    const now = dayjs();
    const startOfMonth = now.startOf('month').toDate();
    const startOfLastMonth = now.subtract(1, 'month').startOf('month').toDate();
    const endOfLastMonth = now.subtract(1, 'month').endOf('month').toDate();

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      newTenantsThisMonth,
      newTenantsLastMonth,
      totalCustomers,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      Tenant.count(),
      Tenant.count({ where: { status: 'active' } }),
      Tenant.count({ where: { status: 'suspended' } }),
      Tenant.count({ where: { created_at: { [Op.gte]: startOfMonth } } }),
      Tenant.count({ where: { created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } }),
      User.count({ where: { role: 'customer' } }),
      Order.count(),
      Order.count({ where: { created_at: { [Op.gte]: startOfMonth } } }),
      Order.count({ where: { created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } }),
      Payment.sum('amount', { where: { status: 'success' } }),
      Payment.sum('amount', { where: { status: 'success', created_at: { [Op.gte]: startOfMonth } } }),
      Payment.sum('amount', { where: { status: 'success', created_at: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } }),
    ]);

    // Plan distribution
    const planCounts = await Tenant.findAll({
      attributes: ['plan', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { status: 'active' },
      group: ['plan'],
      raw: true,
    });

    // Run optional sub-queries individually so one failure doesn't crash the whole endpoint
    const mrr = await calculateMRR().catch(() => 0);
    const tenantGrowth = await getTenantGrowth(6).catch(() => []);
    const revenueGrowth = await getRevenueGrowth(6).catch(() => []);
    const topTenants = await getTopTenantsByRevenue(5).catch(() => []);

    const growthRate = (current, previous) => {
      if (!previous) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalTenants,
          activeTenants,
          suspendedTenants,
          newTenantsThisMonth,
          tenantGrowthRate: growthRate(newTenantsThisMonth, newTenantsLastMonth),
          totalCustomers,
          totalOrders,
          ordersThisMonth,
          ordersGrowthRate: growthRate(ordersThisMonth, ordersLastMonth),
          totalRevenue: totalRevenue || 0,
          revenueThisMonth: revenueThisMonth || 0,
          revenueLastMonth: revenueLastMonth || 0,
          revenueGrowthRate: growthRate(revenueThisMonth || 0, revenueLastMonth || 0),
          mrr,
        },
        planDistribution: planCounts.map(p => ({
          plan: p.plan,
          planName: PLANS[p.plan]?.name || p.plan,
          count: parseInt(p.count),
          price: PLANS[p.plan]?.price || 0,
        })),
        tenantGrowth,
        revenueGrowth,
        topTenants,
      },
    });
  } catch (err) { next(err); }
};

// Safe: if subscriptions table doesn't exist yet, returns 0
const calculateMRR = async () => {
  const activeSubs = await Subscription.findAll({
    where: { status: 'active' },
    attributes: ['plan', 'billingCycle'],
  });

  return activeSubs.reduce((sum, sub) => {
    const plan = PLANS[sub.plan];
    if (!plan || plan.price === 0) return sum;
    const monthly = sub.billingCycle === 'yearly' ? plan.price / 12 : plan.price;
    return sum + monthly;
  }, 0);
};

const getTenantGrowth = async (months) => {
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate();
    const end = dayjs().subtract(i, 'month').endOf('month').toDate();
    const count = await Tenant.count({ where: { created_at: { [Op.between]: [start, end] } } });
    result.push({ month: dayjs().subtract(i, 'month').format('MMM YYYY'), count });
  }
  return result;
};

const getRevenueGrowth = async (months) => {
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate();
    const end = dayjs().subtract(i, 'month').endOf('month').toDate();
    const revenue = await Payment.sum('amount', {
      where: { status: 'success', created_at: { [Op.between]: [start, end] } },
    });
    result.push({ month: dayjs().subtract(i, 'month').format('MMM YYYY'), revenue: revenue || 0 });
  }
  return result;
};

// Simplified: fetch payments with orders in memory to avoid complex GROUP BY SQL
const getTopTenantsByRevenue = async (limit) => {
  const payments = await Payment.findAll({
    where: { status: 'success' },
    attributes: ['amount'],
    include: [{ association: 'order', attributes: ['tenantId'] }],
  });

  // Aggregate by tenantId in JS
  const byTenant = {};
  for (const p of payments) {
    const tenantId = p.order?.tenantId;
    if (!tenantId) continue;
    if (!byTenant[tenantId]) byTenant[tenantId] = { totalRevenue: 0, orderCount: 0 };
    byTenant[tenantId].totalRevenue += parseFloat(p.amount) || 0;
    byTenant[tenantId].orderCount += 1;
  }

  const sorted = Object.entries(byTenant)
    .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const tenantIds = sorted.map(([id]) => id);
  const tenants = await Tenant.findAll({ where: { id: tenantIds }, attributes: ['id', 'name', 'slug', 'plan'] });
  const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]));

  return sorted.map(([id, stats]) => ({
    tenant: tenantMap[id] || { id },
    totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
    orderCount: stats.orderCount,
  }));
};

module.exports = { listTenants, createTenant, getTenant, updateTenant, deleteTenant, platformAnalytics };
