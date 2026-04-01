'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const resolveTenant = require('../../middleware/resolveTenant');
const requireRole = require('../../middleware/requireRole');
const { getBalance, getHistory, getAdminSummary } = require('./loyalty.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/balance', getBalance);
router.get('/history', getHistory);
router.get('/admin/summary', requireRole('admin'), getAdminSummary);

module.exports = router;
