'use strict';
const express = require('express');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const {
  listReceipts,
  getReceipt,
  createReceipt,
  updateReceipt,
} = require('./pos.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

const adminScopes = ['admin', 'store_manager', 'salesperson'];

router.get('/receipts', requireRole(adminScopes), listReceipts);
router.post('/receipts', requireRole(adminScopes), createReceipt);
router.get('/receipts/:receiptId', requireRole(adminScopes), getReceipt);
router.patch('/receipts/:receiptId', requireRole(adminScopes), updateReceipt);

module.exports = router;
