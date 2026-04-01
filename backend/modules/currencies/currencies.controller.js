'use strict';
const { SUPPORTED_CURRENCIES, getCurrencyMetadata } = require('../../utils/currency');

const listCurrencies = (req, res, next) => {
  try {
    const tenantCurrency = req.tenant?.settings?.currency;
    const currentCurrency = getCurrencyMetadata(tenantCurrency);
    res.json({
      success: true,
      data: {
        supportedCurrencies: SUPPORTED_CURRENCIES,
        currentCurrency
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCurrencies };
