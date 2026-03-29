'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const router = express.Router({ mergeParams: true });
const resolveTenant = require('../../middleware/resolveTenant');
const { listStoreStock, upsertStoreStock, deleteStoreStock } = require('./storeStock.controller');

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager', 'salesperson']));

router.get('/:storeId/stock', listStoreStock);
router.post('/:storeId/stock', upsertStoreStock);
router.delete('/:storeId/stock/:productId', deleteStoreStock);

module.exports = router;
