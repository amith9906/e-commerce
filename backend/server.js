'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const tenantsRoutes = require('./modules/tenants/tenants.routes');
const usersRoutes = require('./modules/users/users.routes');
const productsRoutes = require('./modules/products/products.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const brandRoutes = require('./modules/brand/brand.routes');
const couponsRoutes = require('./modules/coupons/coupons.routes');
const promotionsRoutes = require('./modules/promotions/promotions.routes');
const storesRoutes = require('./modules/stores/stores.routes');
const storeStockRoutes = require('./modules/storeStock/storeStock.routes');
const transfersRoutes = require('./modules/transfers/transfers.routes');
const billingRoutes = require('./modules/billing/billing.routes');

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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/super/tenants', tenantsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/store-stock', storeStockRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/billing', billingRoutes);

// Error Handling
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Export app for testing, or start if running directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

module.exports = app;
