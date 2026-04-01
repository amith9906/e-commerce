'use strict';
const express = require('express');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const resolveTenant = require('../../middleware/resolveTenant');
const {
  listGiftCards,
  createGiftCard,
  sendGiftCardEmail,
  updateGiftCard,
  validateGiftCard,
  listGiftCardRedemptions,
  getGiftCardSummary
} = require('./giftcards.controller');

const router = express.Router();

router.use(resolveTenant, authenticate);

router.post('/validate', validateGiftCard);
router.get('/redemptions', requireRole('admin'), listGiftCardRedemptions);
router.get('/', requireRole('admin'), listGiftCards);
router.get('/summary', requireRole('admin'), getGiftCardSummary);
router.post('/:id/send-email', requireRole('admin'), sendGiftCardEmail);
router.post('/', requireRole('admin'), createGiftCard);
router.patch('/:id', requireRole('admin'), updateGiftCard);

module.exports = router;
