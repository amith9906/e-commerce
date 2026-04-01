'use strict';
const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const { planGate } = require('../../middleware/planGate');
const {
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
} = require('./saas.controller');

const router = express.Router();

// ── Public routes ────────────────────────────────────────────────────────
router.get('/plans', listPlans);

router.post(
  '/signup',
  [
    body('storeName').notEmpty().withMessage('Store name is required.'),
    body('slug').notEmpty().isSlug().withMessage('Slug must be a valid URL slug.'),
    body('adminName').notEmpty().withMessage('Admin name is required.'),
    body('adminEmail').isEmail().withMessage('Valid admin email is required.'),
    body('adminPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  signup
);

// Stripe webhook — must use raw body, so registered in server.js with express.raw()
router.post('/webhook', stripeWebhook);

// ── Authenticated tenant routes ──────────────────────────────────────────
router.use(resolveTenant, authenticate, requireRole('admin', 'superadmin'));

router.get('/subscription', getSubscription);
router.get('/usage', getUsage);

router.post(
  '/checkout',
  [body('plan').notEmpty().withMessage('Plan is required.')],
  validate,
  createCheckout
);

router.post('/portal', createPortal);
router.post('/cancel', cancelSubscriptionHandler);

router.get('/audit-logs', planGate('auditLogs'), getAuditLogs);
router.get('/export', planGate('dataExport'), exportData);

router.put(
  '/custom-domain',
  planGate('customDomain'),
  [body('customDomain').optional({ nullable: true }).isFQDN({ require_tld: true }).withMessage('Must be a valid domain.')],
  validate,
  setCustomDomain
);

module.exports = router;
