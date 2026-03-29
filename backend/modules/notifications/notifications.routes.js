'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');

const { getNotifications, markAsRead, broadcast } = require('./notifications.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/', getNotifications);

router.patch(
  '/:id/read',
  [param('id').isUUID().withMessage('Invalid Notification ID')],
  validate,
  markAsRead
);

router.post(
  '/broadcast',
  requireRole('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  validate,
  broadcast
);

module.exports = router;
