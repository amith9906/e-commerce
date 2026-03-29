'use strict';
const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const upload = require('../../middleware/upload');

const { getBrandConfig, updateBrandConfig } = require('./brand.controller');

const router = express.Router();

router.use(resolveTenant);

router.get('/', getBrandConfig);

// Admin only mapping bulk update
router.put(
  '/',
  authenticate,
  requireRole('admin'),
  upload.single('logo'),
  validate,
  updateBrandConfig
);

module.exports = router;
