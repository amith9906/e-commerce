'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const resolveTenant = require('../../middleware/resolveTenant');
const requireRole = require('../../middleware/requireRole');
const auditLogger = require('../../middleware/auditLogger');
const {
  createTicket,
  listTickets,
  viewTicket,
  adminListTickets,
  addMessage,
} = require('./tickets.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.post(
  '/',
  auditLogger('ticket:create', 'Ticket'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Message body is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  validate,
  createTicket
);

router.get('/', listTickets);
router.get('/:id', [param('id').isUUID()], validate, viewTicket);

router.post(
  '/:id/messages',
  requireRole('admin', 'superadmin'),
  auditLogger('ticket:addMessage', 'Ticket'),
  [
    param('id').isUUID().withMessage('Valid ticket ID required'),
    body('body').notEmpty().withMessage('Message body is required'),
    body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  ],
  validate,
  addMessage
);

router.get('/admin/all', requireRole('admin', 'superadmin'), adminListTickets);

module.exports = router;
