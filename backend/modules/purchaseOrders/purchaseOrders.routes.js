'use strict';
const express = require('express');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder
} = require('./purchaseOrders.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/', requireRole('admin'), listPurchaseOrders);
router.post('/', requireRole('admin'), createPurchaseOrder);
router.get('/:purchaseOrderId', requireRole('admin'), getPurchaseOrder);
router.patch('/:purchaseOrderId', requireRole('admin'), updatePurchaseOrder);
router.post('/:purchaseOrderId/receive', requireRole('admin'), receivePurchaseOrder);

module.exports = router;
