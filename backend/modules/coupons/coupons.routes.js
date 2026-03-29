'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const { listCoupons, createCoupon, validateCoupon } = require('./coupons.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/', listCoupons);
router.post('/', requireRole('admin'), createCoupon);
router.post('/validate', validateCoupon);

module.exports = router;
