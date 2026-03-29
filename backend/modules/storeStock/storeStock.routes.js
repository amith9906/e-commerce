'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const router = express.Router({ mergeParams: true });
const resolveTenant = require('../../middleware/resolveTenant');
const { listStoreStock, upsertStoreStock, deleteStoreStock, getProductAvailability, getProductsAvailability } = require('./storeStock.controller');

router.get('/product/:productId/availability', resolveTenant, getProductAvailability);
router.get('/products/availability', resolveTenant, getProductsAvailability);

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager', 'salesperson']));

router.get('/:storeId/stock', listStoreStock);
router.post('/:storeId/stock', upsertStoreStock);
router.delete('/:storeId/stock/:productId', deleteStoreStock);

module.exports = router;
