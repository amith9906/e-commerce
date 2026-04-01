'use strict';
const express = require('express');
const router = express.Router();
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const { body } = require('express-validator');
const { getTemplate, updateTemplate, previewTemplate, previewTemplatePdf } = require('./invoices.controller');

router.use(resolveTenant, authenticate, requireRole(['admin', 'store_manager']));

router.get('/template', getTemplate);
router.put(
  '/template',
  [body('name').optional().isString(), body('body').notEmpty().withMessage('Template body is required')],
  validate,
  updateTemplate
);

router.post(
  '/preview',
  [body('body').optional().isString()],
  validate,
  previewTemplate
);

router.post(
  '/preview/pdf',
  [body('body').optional().isString()],
  validate,
  previewTemplatePdf
);

module.exports = router;
