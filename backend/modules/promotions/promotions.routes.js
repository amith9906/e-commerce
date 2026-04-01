'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const { listPromotions, createPromotion, heroPromotions, updatePromotion, deletePromotion } = require('./promotions.controller');

const router = express.Router();

router.get('/hero', resolveTenant, heroPromotions);

router.use(resolveTenant, authenticate);

router.get('/', listPromotions);
router.post('/', requireRole('admin'), createPromotion);
router.patch('/:id', requireRole('admin'), updatePromotion);
router.delete('/:id', requireRole('admin'), deletePromotion);

module.exports = router;
