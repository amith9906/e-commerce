'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const {
  listBillingRecords,
  createManualBilling,
  getBillingInvoice,
  exportBillingRecords,
  getStoreRevenue,
  updatePaymentStatus
} = require('./billing.controller');

router.get('/invoice/:id', resolveTenant, authenticate, getBillingInvoice);
router.post('/manual', resolveTenant, authenticate, requireRole(['admin', 'store_manager']), createManualBilling);
router.get('/export', resolveTenant, authenticate, requireRole(['admin', 'store_manager']), exportBillingRecords);

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.get('/', listBillingRecords);
router.get('/store-revenue', getStoreRevenue);
router.patch('/:id/payment-status', updatePaymentStatus);

module.exports = router;
