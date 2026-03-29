'use strict';
const express = require('express');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { createPricingRule, listPricingRules } = require('./pricing.controller');

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.post('/', createPricingRule);
router.get('/', listPricingRules);

module.exports = router;
