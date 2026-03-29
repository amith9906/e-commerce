'use strict';
const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { listTenants, createTenant, getTenant, updateTenant, deleteTenant, platformAnalytics } = require('./tenants.controller');

const router = express.Router();
router.use(authenticate, requireRole('superadmin'));

router.get('/', listTenants);
router.post('/', [body('name').notEmpty(), body('slug').notEmpty().isSlug()], validate, createTenant);
router.get('/analytics', platformAnalytics);
router.get('/:id', getTenant);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);

module.exports = router;
