'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const optionalAuthenticate = require('../../middleware/optionalAuthenticate');
const { subscribeBackInStock, listAlertsForAdmin, cancelAlert } = require('./alerts.controller');

const router = express.Router();

router.post(
  '/',
  resolveTenant,
  optionalAuthenticate,
  [
    body('productId').isUUID().withMessage('Valid product ID is required'),
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validate,
  subscribeBackInStock
);

router.get('/', resolveTenant, authenticate, requireRole('admin', 'superadmin'), listAlertsForAdmin);

router.delete(
  '/:id',
  resolveTenant,
  authenticate,
  [param('id').isUUID().withMessage('Valid alert ID is required')],
  validate,
  cancelAlert
);

module.exports = router;
