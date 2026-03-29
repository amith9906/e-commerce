'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const router = express.Router();
const { createStore, listStores, getStoreDetails, updateStore, assignSalesPerson } = require('./stores.controller');

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.post('/', createStore);
router.get('/', listStores);
router.get('/:storeId', getStoreDetails);
router.patch('/:storeId', updateStore);
router.post('/:storeId/assign', assignSalesPerson);

module.exports = router;
