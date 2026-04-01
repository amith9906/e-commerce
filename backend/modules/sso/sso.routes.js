'use strict';
const express = require('express');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { planGate } = require('../../middleware/planGate');
const { listSettings, upsertSetting, deleteSetting } = require('./sso.controller');

const router = express.Router();

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));
router.get('/', planGate('sso'), listSettings);
router.post('/', planGate('sso'), upsertSetting);
router.delete('/:provider', planGate('sso'), deleteSetting);

module.exports = router;
