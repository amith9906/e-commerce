'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../../middleware/validate');
const resolveTenant = require('../../middleware/resolveTenant');
const authenticate = require('../../middleware/authenticate');
const { getWishlist, addToWishlist, removeFromWishlist } = require('./wishlist.controller');

const router = express.Router();
router.use(resolveTenant, authenticate);

router.get('/', getWishlist);

router.post('/',
  [body('productId').isUUID().withMessage('Valid productId is required')],
  validate,
  addToWishlist
);

router.delete('/:id',
  [param('id').isUUID().withMessage('Invalid wishlist item id')],
  validate,
  removeFromWishlist
);

module.exports = router;
