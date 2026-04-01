'use strict';
const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  getRestrictions,
  upsertRestriction,
  checkAvailability
} = require('./delivery.controller');

const router = express.Router();

router.use(resolveTenant);

router.get('/', getRegions);
router.get('/availability', checkAvailability);

router.use(authenticate, requireRole('admin'));

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Region name is required'),
    body('locations').isArray().withMessage('Locations must be provided'),
    body('leadTimeDays').optional().isInt({ min: 0 })
  ],
  validate,
  createRegion
);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('locations').optional().isArray(),
    body('leadTimeDays').optional().isInt({ min: 0 })
  ],
  validate,
  updateRegion
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  deleteRegion
);

router.get(
  '/restrictions',
  [
    query('regionId').optional().isUUID(),
    query('productId').optional().isUUID()
  ],
  validate,
  getRestrictions
);

router.post(
  '/restrictions',
  [
    body('regionId').isUUID().withMessage('Region required'),
    body('isAllowed').optional().isBoolean(),
    body('productId').optional().isUUID()
  ],
  validate,
  upsertRestriction
);

module.exports = router;
