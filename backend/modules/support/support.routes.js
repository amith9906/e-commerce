'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const isAdmin = require('../../middleware/isAdmin'); // Assuming this exists or using role checks
const resolveTenant = require('../../middleware/resolveTenant');
const auditLogger = require('../../middleware/auditLogger');
const { submitContact, getInquiries, updateInquiryStatus, listOwnMessages } = require('./support.controller');

const router = express.Router();

router.use(resolveTenant);

router.post('/',
  auditLogger('support:create', 'ContactMessage'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  validate,
  submitContact
);

router.get('/me',
  authenticate,
  auditLogger('support:listOwn', 'ContactMessage'),
  listOwnMessages
);

router.get('/',
  authenticate,
  isAdmin,
  auditLogger('support:list', 'ContactMessage'),
  getInquiries
);

router.patch('/:id/status',
  authenticate,
  isAdmin,
  auditLogger('support:updateStatus', 'ContactMessage'),
  [
    param('id').isUUID(),
    body('status').isIn(['new', 'read', 'resolved']),
    body('adminNotes').optional().isString()
  ],
  validate,
  updateInquiryStatus
);

module.exports = router;
