'use strict';
const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const { getTenantProfile, getTenantSettings, updateTenantSettings } = require('./tenantSettings.controller');

const router = express.Router();

router.use(resolveTenant);
router.use(authenticate);
router.use(requireRole('admin', 'superadmin'));

router.get('/me', getTenantProfile);
router.get('/settings', getTenantSettings);
router.put(
  '/settings',
  [
    body('settings').notEmpty().withMessage('Settings payload is required.'),
  ],
  validate,
  updateTenantSettings
);

module.exports = router;
