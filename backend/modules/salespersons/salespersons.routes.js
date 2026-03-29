'use strict';
const express = require('express');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const upload = require('../../middleware/upload');
const { getAssignments, getPendingTransfers, logDelivery, getKpi, attachDeliveryProof } = require('./salespersons.controller');

router.use(resolveTenant, authenticate, requireRole('salesperson'));

router.get('/assignments', getAssignments);
router.get('/pending-transfers', getPendingTransfers);
router.post('/transfers/:transferId/deliver', logDelivery);
router.post('/transfers/:transferId/proof', upload.single('proof'), attachDeliveryProof);
router.get('/kpi', getKpi);

module.exports = router;
