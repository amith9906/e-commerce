'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');

const {
  createOrder,
  listOrders,
  getOrder,
  getOrderInvoice,
  downloadInvoicePdf,
  updateOrderStatus,
  requestReturn,
  listReturns,
  updateReturnStatus,
  updatePaymentStatus
} = require('./orders.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isUUID().withMessage('Valid Product ID required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
    body('shippingAddressId').isUUID().withMessage('Valid Address ID required'),
  ],
  validate,
  createOrder
);

router.get('/', listOrders);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid order ID')],
  validate,
  getOrder
);

router.get(
  '/:id/invoice',
  [param('id').isUUID().withMessage('Invalid order ID')],
  validate,
  getOrderInvoice
);

router.get(
  '/:id/invoice/pdf',
  [param('id').isUUID().withMessage('Invalid order ID')],
  validate,
  downloadInvoicePdf
);

router.get(
  '/:id/invoice',
  [param('id').isUUID().withMessage('Invalid order ID')],
  validate,
  getOrderInvoice
);

// Admin only
router.patch(
  '/:id/status',
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('Invalid order ID'),
    body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
  ],
  validate,
  updateOrderStatus
);

// Returns
router.post(
  '/:id/returns',
  [
    param('id').isUUID().withMessage('Invalid order ID'),
    body('type').isIn(['return', 'replacement']).withMessage('Invalid type'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],
  validate,
  requestReturn
);

router.get('/admin/returns', requireRole('admin'), listReturns);
router.patch(
  '/admin/returns/:id',
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('Invalid ID'),
    body('status').isIn(['approved', 'rejected', 'completed']).withMessage('Invalid status')
  ],
  validate,
  updateReturnStatus
);

module.exports = router;
