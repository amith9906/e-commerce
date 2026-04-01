'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');

const {
  listUsers,
  getProfile,
  updateProfile,
  addAddress,
  getUserViews,
  changePassword,
  updateAddress,
  deleteAddress,
} = require('./users.controller');

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

router.patch(
  '/addresses/:id',
  [
    param('id').isUUID().withMessage('Valid address ID is required'),
    body('label').optional().isString(),
    body('fullName').optional().isString(),
    body('city').optional().isString(),
    body('country').optional().isString(),
    body('isDefault').optional().isBoolean(),
  ],
  validate,
  updateAddress
);

router.delete(
  '/addresses/:id',
  [param('id').isUUID().withMessage('Valid address ID is required')],
  validate,
  deleteAddress
);

router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
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
