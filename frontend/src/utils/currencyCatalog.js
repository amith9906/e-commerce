export const currencyCatalog = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', fractionDigits: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', fractionDigits: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', fractionDigits: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', fractionDigits: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE', fractionDigits: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', fractionDigits: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY', fractionDigits: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', fractionDigits: 0 }
];

export const getCurrencyMetadata = (code) => {
  const normalized = (code || '').toString().trim().toUpperCase();
  return currencyCatalog.find((entry) => entry.code === normalized) || currencyCatalog[0];
};
