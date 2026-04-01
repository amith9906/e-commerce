'use strict';
const express = require('express');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier
} = require('./suppliers.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.get('/', requireRole('admin'), listSuppliers);
router.post('/', requireRole('admin'), createSupplier);
router.get('/:supplierId', requireRole('admin'), getSupplier);
router.patch('/:supplierId', requireRole('admin'), updateSupplier);

module.exports = router;
