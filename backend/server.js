'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const tenantsRoutes = require('./modules/tenants/tenants.routes');
const usersRoutes = require('./modules/users/users.routes');
const productsRoutes = require('./modules/products/products.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const stockAlertsRoutes = require('./modules/stock/alerts.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const brandRoutes = require('./modules/brand/brand.routes');
const couponsRoutes = require('./modules/coupons/coupons.routes');
const promotionsRoutes = require('./modules/promotions/promotions.routes');
const giftcardsRoutes = require('./modules/giftcards/giftcards.routes');
const storesRoutes = require('./modules/stores/stores.routes');
const storeStockRoutes = require('./modules/storeStock/storeStock.routes');
const transfersRoutes = require('./modules/transfers/transfers.routes');
const suppliersRoutes = require('./modules/suppliers/suppliers.routes');
const purchaseOrdersRoutes = require('./modules/purchaseOrders/purchaseOrders.routes');
const currenciesRoutes = require('./modules/currencies/currencies.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const salespersonsRoutes = require('./modules/salespersons/salespersons.routes');
const posRoutes = require('./modules/pos/pos.routes');
const alertsRoutes = require('./modules/alerts/alerts.routes');
const invoicesRoutes = require('./modules/invoices/invoices.routes');
const commissionsRoutes = require('./modules/commissions/commissions.routes');
const pickupsRoutes = require('./modules/pickups/pickups.routes');
const pricingRoutes = require('./modules/pricing/pricing.routes');
const reviewsRoutes = require('./modules/products/reviews.routes');
const supportRoutes = require('./modules/support/support.routes');
const ticketsRoutes = require('./modules/tickets/tickets.routes');
const saasRoutes = require('./modules/saas/saas.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const tenantSettingsRoutes = require('./modules/tenantSettings/tenantSettings.routes');
const loyaltyRoutes = require('./modules/loyalty/loyalty.routes');
const webhooksRoutes = require('./modules/webhooks/webhooks.routes');
const apiKeysRoutes = require('./modules/apiKeys/apiKeys.routes');
const emailTemplatesRoutes = require('./modules/emailTemplates/emailTemplates.routes');
const ssoRoutes = require('./modules/sso/sso.routes');
const tenantRateLimit = require('./middleware/tenantRateLimit');
const resolveTenant = require('./middleware/resolveTenant');

const app = express();

// Global Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow serving uploaded images

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy prevented access from ' + origin));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

// Per-tenant rate limiting (applied after tenant is resolved by routes)
// Applied as a route-level middleware in individual routers that use resolveTenant

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

// Support rate limiting
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many contact messages sent, please try again later.' }
});
app.use('/api/support', supportLimiter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Stripe webhook needs raw body (registered before express.json() middleware parses it)
const { stripeWebhook } = require('./modules/saas/saas.controller');
app.post('/api/saas/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/super/tenants', tenantsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/stock/alerts', stockAlertsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/currencies', currenciesRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/gift-cards', giftcardsRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/store-stock', storeStockRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/salespersons', salespersonsRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/email-templates', emailTemplatesRoutes);
app.use('/api/sso', ssoRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/invoice-template', invoicesRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/pickups', pickupsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/tenants', tenantSettingsRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// Error Handling
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}.`);
  });

  // Abandoned cart recovery — runs every 2 hours
  const { runCartRecovery } = require('./services/cartRecoveryService');
  const CART_RECOVERY_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
  const runCartRecoveryJob = async () => {
    try {
      const summary = await runCartRecovery();
      console.log('[cron] Cart recovery job completed', summary);
    } catch (err) {
      console.error('[cron] Cart recovery job failed', err.message);
    }
  };
  // Run once 5 minutes after server start, then every 2 hours
  setTimeout(() => {
    runCartRecoveryJob();
    setInterval(runCartRecoveryJob, CART_RECOVERY_INTERVAL_MS);
  }, 5 * 60 * 1000);
}

module.exports = app;
