'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const upload = require('../../middleware/upload');

const {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct, adjustStock, getFilterOptions
} = require('./products.controller');

const router = express.Router();

// Product routes require tenant resolution.
// GET routes are accessible by anyone (for guest browsing), but if logged in, analytics tracking uses auth.
// We use a middleware to optionally authenticate if a token is present, else continue.
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) return authenticate(req, res, next);
  next();
};

router.use(resolveTenant);

router.get('/meta/filters', getFilterOptions);
router.get('/', optionalAuth, getProducts);
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid product ID format')],
  validate,
  optionalAuth,
  getProductById
);

// Admin only routes
router.use(authenticate, requireRole('admin'));

router.post(
  '/',
  upload.array('images', 5),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isNumeric().withMessage('Valid numeric price is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock must be an integer >= 0'),
  ],
  validate,
  createProduct
);

router.put(
  '/:id',
  upload.array('images', 5),
  [param('id').isUUID().withMessage('Invalid product ID format')],
  validate,
  updateProduct
);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid product ID format')],
  validate,
  deleteProduct
);

router.post(
  '/:id/stock/adjust',
  [
    param('id').isUUID().withMessage('Invalid product ID format'),
    body('amount').isInt().withMessage('Adjustment amount must be an integer'),
  ],
  validate,
  adjustStock
);

module.exports = router;
