'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');

const { getStock, updateStock } = require('./stock.controller');

const router = express.Router();

// Stock management is Admin only
router.use(resolveTenant, authenticate, requireRole('admin'));

router.get('/', getStock);

router.put(
  '/:productId',
  [
    param('productId').isUUID().withMessage('Invalid Product ID'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be an integer >= 0'),
    body('lowStockThreshold').optional().isInt({ min: 1 }).withMessage('Threshold must be an integer >= 1'),
  ],
  validate,
  updateStock
);

module.exports = router;
