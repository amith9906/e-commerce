'use strict';
const express = require('express');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { createPickupRequest, listPickupRequests, updatePickupStatus } = require('./pickups.controller');

router.use(resolveTenant, authenticate);

router.post('/', createPickupRequest);
router.get('/', listPickupRequests);
router.patch('/:id/status', requireRole(['admin', 'store_manager']), updatePickupStatus);

module.exports = router;
