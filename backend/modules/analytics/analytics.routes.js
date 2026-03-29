'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');

const {
  getSalesStats,
  getTopViewedProducts,
  getBasicStats,
  getStateSalesStats,
  getTopSellingProducts,
  getStoreRevenueStats,
  getSalesPersonPerformance,
  getStoreOrderBreakdown
} = require('./analytics.controller');
const { refreshSummaries } = require('./summaries.controller');

const router = express.Router();

router.use(resolveTenant, authenticate, requireRole('admin'));

router.get('/sales', getSalesStats);
router.get('/sales/state', getStateSalesStats);
router.get('/views', getTopViewedProducts);
router.get('/products/topselling', getTopSellingProducts);
router.get('/stats', getBasicStats);
router.get('/stores/revenue', getStoreRevenueStats);
router.get('/salespersons/performance', getSalesPersonPerformance);
router.get('/stores/breakdown', getStoreOrderBreakdown);
router.post('/summaries/refresh', refreshSummaries);

module.exports = router;
