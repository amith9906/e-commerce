'use strict';
const express = require('express');
const { param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const isAdmin = require('../../middleware/isAdmin');
const resolveTenant = require('../../middleware/resolveTenant');
const { body } = require('express-validator');

const { getPayments, createPaymentIntent, confirmPaymentResult, processRefund } = require('./payments.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/', isAdmin, getPayments);

router.post(
  '/intent',
  [body('paymentId').isUUID().withMessage('Invalid Payment ID')],
  validate,
  createPaymentIntent
);

router.post(
  '/:id/confirm',
  [param('id').isUUID().withMessage('Invalid Payment ID')],
  validate,
  confirmPaymentResult
);

router.post(
  '/:id/refund',
  isAdmin,
  [param('id').isUUID().withMessage('Invalid Payment ID')],
  validate,
  processRefund
);

module.exports = router;
