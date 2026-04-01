'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const {
  getCart,
  upsertCartItem,
  updateCartItem,
  removeCartItem,
  recoverCart,
  getCartRecoverySummary,
  triggerCartRecovery
} = require('./cart.controller');

const router = express.Router();
router.use(resolveTenant);

router.get('/recover/:token', recoverCart);

router.use(authenticate);
router.get('/recoveries/summary', requireRole('admin'), getCartRecoverySummary);
router.post('/recoveries/trigger', requireRole('admin'), triggerCartRecovery);

router.get('/', getCart);

router.post('/',
  [body('productId').isUUID().withMessage('Valid productId is required')],
  validate,
  upsertCartItem
);

router.patch('/:id',
  [param('id').isUUID().withMessage('Invalid cart item id'), body('quantity').isInt({ min: 1 })],
  validate,
  updateCartItem
);

router.delete('/:id',
  [param('id').isUUID().withMessage('Invalid cart item id')],
  validate,
  removeCartItem
);

module.exports = router;
