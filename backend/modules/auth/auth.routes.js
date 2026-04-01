'use strict';
const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { register, verifyOtp, resendOtp, login, forgotPassword, resetPassword } = require('./auth.controller');
const resolveTenant = require('../../middleware/resolveTenant');

const router = express.Router();

router.post(
  '/register',
  resolveTenant,
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })],
  validate,
  register
);

router.post(
  '/verify-otp',
  [body('userId').notEmpty(), body('otp').isLength({ min: 6, max: 6 })],
  validate,
  verifyOtp
);

router.post(
  '/resend-otp',
  [body('userId').notEmpty()],
  validate,
  resendOtp
);

router.post(
  '/login',
  resolveTenant,
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post(
  '/forgot-password',
  resolveTenant,
  [body('email').isEmail()],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  resolveTenant,
  [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  resetPassword
);

module.exports = router;
