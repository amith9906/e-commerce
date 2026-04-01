'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const upload = require('../../middleware/upload');
const csvUpload = require('../../middleware/csvUpload');

const {
  getProducts, getProductById, getProductSummary, createProduct, updateProduct, deleteProduct, adjustStock,
  exportProductsCsv, importProductsCsv,
  getFilterOptions, getAutocomplete, getRecommendations,
  listProductQuestions, createProductQuestion, updateProductQuestion,
  getRecentlyViewed, getSocialProof,
  getProductPriceHistory
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

router.get('/autocomplete', optionalAuth, getAutocomplete);
router.get('/meta/filters', getFilterOptions);
router.get('/recently-viewed', authenticate, getRecentlyViewed);
router.get('/:id/questions', optionalAuth, listProductQuestions);
router.post(
  '/:id/questions',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid product ID format'),
    body('question').trim().notEmpty().withMessage('Question text is required')
  ],
  validate,
  createProductQuestion
);
router.get('/:id/social-proof', optionalAuth, getSocialProof);

router.get(
  '/:id/summary',
  [param('id').isUUID().withMessage('Invalid product ID format')],
  validate,
  optionalAuth,
  getProductSummary
);

router.get('/', optionalAuth, getProducts);
router.get(
  '/:id/price-history',
  [param('id').isUUID().withMessage('Invalid product ID format')],
  validate,
  optionalAuth,
  getProductPriceHistory
);
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid product ID format')],
  validate,
  optionalAuth,
  getProductById
);

router.get('/:id/recommendations', optionalAuth, getRecommendations);

// Admin only routes
router.use(authenticate, requireRole('admin'));

router.get('/export', exportProductsCsv);
router.post('/import', csvUpload.single('file'), importProductsCsv);

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

router.patch(
  '/questions/:questionId',
  [
    param('questionId').isUUID().withMessage('Invalid question ID'),
    body('answer').optional().isString(),
    body('status').optional().isIn(['pending', 'published', 'hidden'])
  ],
  validate,
  updateProductQuestion
);

module.exports = router;
