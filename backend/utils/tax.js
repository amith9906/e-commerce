'use strict';

const sanitizeRate = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return numeric;
};

const sanitizeLabel = (value, fallback = 'Tax') => {
  if (!value && value !== 0) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const resolveTaxConfig = ({ tenant, region }) => {
  const tenantRate = sanitizeRate(tenant?.settings?.taxRate);
  const tenantLabel = sanitizeLabel(tenant?.settings?.taxLabel, 'Tax');
  const regionRate =
    region && (region.taxRate !== null && region.taxRate !== undefined)
      ? sanitizeRate(region.taxRate)
      : tenantRate;
  const regionLabel =
    region && region.taxLabel ? sanitizeLabel(region.taxLabel, tenantLabel) : tenantLabel;

  return {
    rate: regionRate,
    label: regionLabel
  };
};

module.exports = {
  sanitizeRate,
  sanitizeLabel,
  resolveTaxConfig
};
