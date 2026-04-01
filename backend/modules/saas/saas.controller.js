'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const {
  Tenant, User, OtpVerification, Subscription, TenantUsage,
  Product, Store, Order, Payment, AuditLog,
} = require('../../models');
const { PLANS, getPlan } = require('../../config/plans');
const { sendMail } = require('../../config/mailer');
const stripeService = require('./stripe.service');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── POST /api/saas/signup ─────────────────────────────────────────────────
// Public: create a new tenant + admin user in one step
const signup = async (req, res, next) => {
  try {
    const { storeName, slug, adminName, adminEmail, adminPassword, plan = 'free' } = req.body;

    // Validate slug uniqueness
    const slugTaken = await Tenant.findOne({ where: { slug } });
    if (slugTaken) {
      return res.status(409).json({ success: false, message: 'Store URL (slug) is already taken. Please choose another.' });
    }

    // Check email not already used as a tenant admin in any tenant
    const emailTaken = await User.findOne({ where: { email: adminEmail, role: { [Op.in]: ['admin', 'superadmin'] } } });
    if (emailTaken) {
      return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: `Invalid plan: ${plan}.` });
    }

    // Create tenant
    const tenant = await Tenant.create({
      name: storeName,
      slug,
      plan,
      status: 'active',
      settings: {},
      createdBy: null,
      updatedBy: null,
    });

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await User.create({
      tenantId: tenant.id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isVerified: false,
      isActive: true,
      createdBy: null,
      updatedBy: null,
    });

    // Create default subscription
    const now = dayjs();
    await Subscription.create({
      tenantId: tenant.id,
      plan,
      status: plan === 'free' ? 'active' : 'trialing',
      billingCycle: plan !== 'free' ? 'monthly' : null,
      currentPeriodStart: now.toDate(),
      currentPeriodEnd: plan !== 'free' ? now.add(14, 'day').toDate() : null, // 14-day trial
      trialEndsAt: plan !== 'free' ? now.add(14, 'day').toDate() : null,
      createdBy: null,
      updatedBy: null,
    });

    // Initialize usage record
    await TenantUsage.create({ tenantId: tenant.id });

    // Send OTP verification
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60000);
    await OtpVerification.create({ userId: admin.id, otpCode: otp, expiresAt, createdBy: admin.id, updatedBy: admin.id });

    await sendMail({
      to: adminEmail,
      subject: `Welcome to ${process.env.PLATFORM_NAME || 'ShopSaaS'} — Verify your account`,
      html: `
        <h2>Welcome, ${adminName}!</h2>
        <p>Your store <strong>${storeName}</strong> has been created.</p>
        <p>Your store URL will be: <strong>${slug}.${process.env.SAAS_DOMAIN || 'yoursaas.com'}</strong></p>
        <p>Please verify your email using this OTP: <strong>${otp}</strong></p>
        <p>It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>
        ${plan !== 'free' ? `<p>Your 14-day free trial has started. No credit card required.</p>` : ''}
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Store created! Check your email to verify your account.',
      userId: admin.id,
      tenantId: tenant.id,
      slug: tenant.slug,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/saas/plans ───────────────────────────────────────────────────
// Public: list all available plans
const listPlans = async (req, res) => {
  const plans = Object.entries(PLANS).map(([key, p]) => ({
    key,
    name: p.name,
    price: p.price,
    billingCycle: p.billingCycle,
    limits: p.limits,
    features: p.features,
  }));
  res.json({ success: true, data: plans });
};

// ─── GET /api/saas/subscription ───────────────────────────────────────────
// Auth (admin): get current tenant subscription
const getSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ where: { tenantId: req.tenant.id }, order: [['created_at', 'DESC']] });
    const plan = getPlan(req.tenant.plan);
    res.json({
      success: true,
      data: {
        subscription: sub,
        plan: { key: req.tenant.plan, ...plan },
        isMockMode: stripeService.isMockMode(),
      },
    });
  } catch (err) { next(err); }
};

// ─── POST /api/saas/checkout ──────────────────────────────────────────────
// Auth (admin): create Stripe checkout session to upgrade plan
const createCheckout = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ success: false, message: 'Invalid plan for checkout.' });
    }

    const priceId = stripeService.getPriceIdForPlan(plan);
    if (!priceId && !stripeService.isMockMode()) {
      return res.status(400).json({ success: false, message: `Stripe price ID not configured for plan: ${plan}` });
    }

    const adminUser = await User.findOne({ where: { tenantId: req.tenant.id, role: 'admin' } });

    const customer = await stripeService.getOrCreateCustomer({
      tenantId: req.tenant.id,
      tenantName: req.tenant.name,
      email: adminUser?.email,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripeService.createCheckoutSession({
      customerId: customer.id,
      priceId: priceId || 'mock_price',
      successUrl: `${frontendUrl}/admin/billing?success=1&plan=${plan}`,
      cancelUrl: `${frontendUrl}/admin/billing?cancelled=1`,
      metadata: { tenantId: req.tenant.id, plan },
    });

    // In mock mode, immediately upgrade the tenant
    if (stripeService.isMockMode()) {
      await activatePlan(req.tenant, plan, customer.id, null, priceId);
    }

    res.json({ success: true, data: { url: session.url, sessionId: session.id, isMockMode: stripeService.isMockMode() } });
  } catch (err) { next(err); }
};

// ─── POST /api/saas/portal ────────────────────────────────────────────────
// Auth (admin): create Stripe customer portal session
const createPortal = async (req, res, next) => {
  try {
    if (stripeService.isMockMode()) {
      return res.json({ success: true, data: { url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/billing`, isMockMode: true } });
    }

    const sub = await Subscription.findOne({ where: { tenantId: req.tenant.id } });
    if (!sub?.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No billing account found. Please subscribe first.' });
    }

    const session = await stripeService.createPortalSession({
      customerId: sub.stripeCustomerId,
      returnUrl: `${process.env.FRONTEND_URL}/admin/billing`,
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (err) { next(err); }
};

// ─── POST /api/saas/cancel ────────────────────────────────────────────────
// Auth (admin): cancel current subscription
const cancelSubscriptionHandler = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ where: { tenantId: req.tenant.id, status: 'active' } });
    if (!sub) return res.status(404).json({ success: false, message: 'No active subscription found.' });

    if (sub.stripeSubscriptionId && !stripeService.isMockMode()) {
      await stripeService.cancelSubscription(sub.stripeSubscriptionId);
    }

    await sub.update({ status: 'cancelled', cancelledAt: new Date(), updatedBy: req.user.id });
    await req.tenant.update({ plan: 'free', updatedBy: req.user.id });

    res.json({ success: true, message: 'Subscription cancelled. Your store has been downgraded to the Free plan.' });
  } catch (err) { next(err); }
};

// ─── POST /api/saas/webhook ───────────────────────────────────────────────
// Public (Stripe webhook): handle subscription events
const stripeWebhook = async (req, res, next) => {
  try {
    if (stripeService.isMockMode()) {
      return res.json({ received: true });
    }

    let event;
    try {
      event = stripeService.constructWebhookEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
    }

    const session = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const { tenantId, plan } = session.metadata || {};
        if (tenantId && plan) {
          const tenant = await Tenant.findByPk(tenantId);
          if (tenant) {
            await activatePlan(tenant, plan, session.customer, session.subscription, null);
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const sub = await Subscription.findOne({ where: { stripeSubscriptionId: session.subscription } });
        if (sub) await sub.update({ status: 'past_due' });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = await Subscription.findOne({ where: { stripeSubscriptionId: session.id } });
        if (sub) {
          await sub.update({ status: 'cancelled', cancelledAt: new Date() });
          const tenant = await Tenant.findByPk(sub.tenantId);
          if (tenant) await tenant.update({ plan: 'free' });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) { next(err); }
};

// ─── GET /api/saas/usage ──────────────────────────────────────────────────
// Auth (admin): get current usage vs plan limits
const getUsage = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const plan = getPlan(req.tenant.plan);

    const [productCount, storeCount, userCount] = await Promise.all([
      Product.count({ where: { tenantId } }),
      Store.count({ where: { tenantId } }),
      User.count({ where: { tenantId, role: { [Op.notIn]: ['superadmin'] } } }),
    ]);

    const startOfMonth = dayjs().startOf('month').toDate();
    const ordersThisMonth = await Order.count({ where: { tenantId, created_at: { [Op.gte]: startOfMonth } } });

    const usage = { productCount, storeCount, userCount, ordersThisMonth };
    const limits = plan.limits;

    const usageWithPercent = Object.entries(usage).map(([key, value]) => {
      const limitKey = {
        productCount: 'products',
        storeCount: 'stores',
        userCount: 'users',
        ordersThisMonth: 'ordersPerMonth',
      }[key];
      const limit = limits[limitKey];
      return {
        key,
        label: formatLabel(key),
        value,
        limit: limit === Infinity ? null : limit,
        percent: limit === Infinity || !limit ? 0 : Math.min(100, Math.round((value / limit) * 100)),
      };
    });

    res.json({
      success: true,
      data: {
        plan: { key: req.tenant.plan, name: plan.name },
        usage: usageWithPercent,
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/saas/audit-logs ─────────────────────────────────────────────
// Auth (admin): list audit logs for the tenant
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const where = { tenantId: req.tenant.id };
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (userId) where.userId = userId;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Math.min(parseInt(limit), 200),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ success: true, data: rows, total: count, page: parseInt(page) });
  } catch (err) { next(err); }
};

// ─── GET /api/saas/export ─────────────────────────────────────────────────
// Auth (admin): export all tenant data as JSON (GDPR)
const exportData = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const [products, orders, users, stores] = await Promise.all([
      Product.findAll({ where: { tenantId }, raw: true }),
      Order.findAll({ where: { tenantId }, raw: true }),
      User.findAll({ where: { tenantId }, attributes: { exclude: ['passwordHash'] }, raw: true }),
      Store.findAll({ where: { tenantId }, raw: true }),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      tenant: { id: req.tenant.id, name: req.tenant.name, slug: req.tenant.slug, plan: req.tenant.plan },
      counts: { products: products.length, orders: orders.length, users: users.length, stores: stores.length },
      data: { products, orders, users, stores },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="export-${req.tenant.slug}-${Date.now()}.json"`);
    res.json(exportPayload);
  } catch (err) { next(err); }
};

// ─── PUT /api/saas/custom-domain ──────────────────────────────────────────
// Auth (admin): set a custom domain for the tenant
const setCustomDomain = async (req, res, next) => {
  try {
    const { customDomain } = req.body;

    if (customDomain) {
      // Check domain not already taken
      const taken = await Tenant.findOne({ where: { customDomain, id: { [Op.ne]: req.tenant.id } } });
      if (taken) return res.status(409).json({ success: false, message: 'This domain is already in use.' });
    }

    await req.tenant.update({ customDomain: customDomain || null, updatedBy: req.user.id });
    res.json({ success: true, message: customDomain ? `Custom domain set to ${customDomain}` : 'Custom domain removed.', data: { customDomain } });
  } catch (err) { next(err); }
};

// ─── Helper: activate a plan after payment ────────────────────────────────
const activatePlan = async (tenant, plan, stripeCustomerId, stripeSubscriptionId, stripePriceId) => {
  const now = dayjs();
  await tenant.update({ plan });

  const existingSub = await Subscription.findOne({ where: { tenantId: tenant.id } });
  const subData = {
    plan,
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: now.toDate(),
    currentPeriodEnd: now.add(1, 'month').toDate(),
    stripeCustomerId,
    stripeSubscriptionId,
    stripePriceId,
    updatedBy: null,
  };

  if (existingSub) {
    await existingSub.update(subData);
  } else {
    await Subscription.create({ tenantId: tenant.id, ...subData, createdBy: null });
  }
};

const formatLabel = (key) => ({
  productCount: 'Products',
  storeCount: 'Stores',
  userCount: 'Team Members',
  ordersThisMonth: 'Orders This Month',
}[key] || key);

module.exports = {
  signup,
  listPlans,
  getSubscription,
  createCheckout,
  createPortal,
  cancelSubscriptionHandler,
  stripeWebhook,
  getUsage,
  getAuditLogs,
  exportData,
  setCustomDomain,
};
