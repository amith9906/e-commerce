import { getCurrencyMetadata } from './currencyCatalog';

export const formatCurrency = (value, currency = 'INR', options = {}) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return `${currency}0.00`;

  const metadata = getCurrencyMetadata(currency);
  const { locale, minimumFractionDigits, maximumFractionDigits, ...rest } = options || {};
  const formatLocale = locale || metadata.locale || 'en-IN';
  const minDigits = minimumFractionDigits ?? metadata.fractionDigits ?? 2;
  const maxDigits = maximumFractionDigits ?? metadata.fractionDigits ?? 2;

  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: metadata.code,
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
    ...rest
  }).format(amount);
};
