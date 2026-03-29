'use strict';
const express = require('express');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { exportCommissionReport } = require('./commissions.controller');

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.get('/export', exportCommissionReport);

module.exports = router;
