'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');

const { listUsers, getProfile, updateProfile, addAddress, getUserViews } = require('./users.controller');

const router = express.Router();

// All user routes require tenant context and authentication
router.use(resolveTenant, authenticate);

// Common profile routes
router.get('/me', getProfile);
router.put(
  '/me',
  [body('name').notEmpty().withMessage('Name is required')],
  validate,
  updateProfile
);

// Customer address routes
router.post(
  '/addresses',
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('addressLine1').notEmpty().withMessage('Address line 1 is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('country').notEmpty().withMessage('Country is required'),
  ],
  validate,
  addAddress
);

// Admin-only routes
router.get('/', requireRole('admin'), listUsers);
router.get(
  '/:id/views',
  requireRole('admin'),
  [param('id').isUUID().withMessage('Valid User ID required')],
  validate,
  getUserViews
);

module.exports = router;
