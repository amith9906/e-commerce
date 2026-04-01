'use strict';
const express = require('express');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { planGate } = require('../../middleware/planGate');
const {
  listWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
} = require('./webhooks.controller');

const router = express.Router();

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.get('/', planGate('outboundWebhooks'), listWebhooks);
router.post('/', planGate('outboundWebhooks'), createWebhook);
router.get('/:webhookId', planGate('outboundWebhooks'), getWebhook);
router.patch('/:webhookId', planGate('outboundWebhooks'), updateWebhook);
router.delete('/:webhookId', planGate('outboundWebhooks'), deleteWebhook);
router.post('/:webhookId/test', planGate('outboundWebhooks'), testWebhook);

module.exports = router;
