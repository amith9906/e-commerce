'use strict';
const express = require('express');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { getLowStockAlerts, getInvoiceAlerts, getDeliveryProofAlerts } = require('./alerts.controller');

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.get('/low-stock', getLowStockAlerts);
router.get('/invoices', getInvoiceAlerts);
router.get('/delivery-proof', getDeliveryProofAlerts);

module.exports = router;
