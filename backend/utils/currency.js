'use strict';

const currencyCatalog = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', fractionDigits: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', fractionDigits: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', fractionDigits: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', fractionDigits: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE', fractionDigits: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', fractionDigits: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY', fractionDigits: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', fractionDigits: 0 }
];

const DEFAULT_CURRENCY_CODE = 'INR';

const SUPPORTED_CURRENCIES = currencyCatalog.map((entry) => ({ ...entry }));

const getCurrencyMetadata = (code) => {
  if (!code) return SUPPORTED_CURRENCIES.find((entry) => entry.code === DEFAULT_CURRENCY_CODE);
  const normalized = String(code).trim().toUpperCase();
  return SUPPORTED_CURRENCIES.find((entry) => entry.code === normalized)
    || SUPPORTED_CURRENCIES.find((entry) => entry.code === DEFAULT_CURRENCY_CODE);
};

const formatCurrency = (amount, currency = DEFAULT_CURRENCY_CODE, options = {}) => {
  const metadata = getCurrencyMetadata(currency);
  const fallback = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const { locale: overrideLocale, minimumFractionDigits, maximumFractionDigits, ...rest } = options || {};
  const locale = overrideLocale || metadata.locale || 'en-IN';
  const minDigits = minimumFractionDigits ?? metadata.fractionDigits ?? 2;
  const maxDigits = maximumFractionDigits ?? metadata.fractionDigits ?? 2;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: metadata.code,
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
    ...rest
  }).format(fallback);
};

const formatINR = (amount) => formatCurrency(amount, 'INR');

module.exports = {
  formatCurrency,
  formatINR,
  SUPPORTED_CURRENCIES,
  getCurrencyMetadata
};
