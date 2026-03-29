'use strict';
const express = require('express');
const { param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const resolveTenant = require('../../middleware/resolveTenant');

const { getPayments, mockPaymentSuccess } = require('./payments.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/', getPayments);

router.post(
  '/:id/mock-success',
  [param('id').isUUID().withMessage('Invalid Payment ID')],
  validate,
  mockPaymentSuccess
);

module.exports = router;
