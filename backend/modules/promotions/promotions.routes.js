'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const { listPromotions, createPromotion } = require('./promotions.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/', listPromotions);
router.post('/', requireRole('admin'), createPromotion);

module.exports = router;
