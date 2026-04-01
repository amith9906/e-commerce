'use strict';
const express = require('express');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { planGate } = require('../../middleware/planGate');
const {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('./emailTemplates.controller');

const router = express.Router();

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.get('/', planGate('emailTemplates'), listTemplates);
router.post('/', planGate('emailTemplates'), createTemplate);
router.get('/:templateType', planGate('emailTemplates'), getTemplate);
router.patch('/:templateType', planGate('emailTemplates'), updateTemplate);
router.delete('/:templateType', planGate('emailTemplates'), deleteTemplate);

module.exports = router;
