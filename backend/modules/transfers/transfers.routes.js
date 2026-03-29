'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const { createTransfer, listTransfers, getTransfer, updateTransferStatus } = require('./transfers.controller');

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager', 'salesperson']));

router.post('/', createTransfer);
router.get('/', listTransfers);
router.get('/:id', getTransfer);
router.patch('/:id/status', updateTransferStatus);

module.exports = router;
