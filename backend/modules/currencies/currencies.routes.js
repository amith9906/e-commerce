'use strict';
const express = require('express');
const { listCurrencies } = require('./currencies.controller');
const resolveTenant = require('../../middleware/resolveTenant');

const router = express.Router();

router.get('/', resolveTenant, listCurrencies);

module.exports = router;
