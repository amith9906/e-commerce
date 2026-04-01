'use strict';
const express = require('express');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { planGate } = require('../../middleware/planGate');
const {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  regenerateApiKey,
} = require('./apiKeys.controller');

const router = express.Router();

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));
router.get('/', planGate('apiKeyManagement'), listApiKeys);
router.post('/', planGate('apiKeyManagement'), createApiKey);
router.post('/:keyId/revoke', planGate('apiKeyManagement'), revokeApiKey);
router.post('/:keyId/regenerate', planGate('apiKeyManagement'), regenerateApiKey);

module.exports = router;
