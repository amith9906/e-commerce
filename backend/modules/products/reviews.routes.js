'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const resolveTenant = require('../../middleware/resolveTenant');
const upload = require('../../middleware/upload');
const { getProductReviews, submitReview } = require('./reviews.controller');

const router = express.Router();

router.use(resolveTenant);

router.get('/:productId', 
  [param('productId').isUUID()],
  validate, 
  getProductReviews
);

router.post('/',
  authenticate,
  upload.array('images', 4),
  [
    body('productId').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString()
  ],
  validate,
  submitReview
);

module.exports = router;
