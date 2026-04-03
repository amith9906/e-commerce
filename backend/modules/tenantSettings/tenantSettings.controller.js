'use strict';
const { Tenant, InvoiceTemplate } = require('../../models');

const ALLOWED_SETTINGS = new Set([
  'currency',
  'taxRate',
  'taxLabel',
  'paymentGateway',
  'stripeSecretKey',
  'stripePublishableKey',
  'vpa',
  'merchantName',
  'invoiceTemplate',
  'supportContacts',
  'statusEmailTemplates',
  'cartRecoveryTemplate',
  'codEnabled',
  'shipping',
  'loyalty',
  'companyName',
  'companyAddress',
  'gstin',
  'companyWebsite',
  'invoiceNotes'
]);
const DEFAULT_SHIPPING_CONFIG = {
  freeShippingThreshold: 2000,
  flatShippingFee: 50,
  pinValidationMode: 'postal',
  origin: { country: 'India', state: '', city: '' },
  rates: {
    sameCity: 20,
    sameState: 40,
    outOfState: 60,
    international: 120
  }
};

const filterSettings = (payload = {}) => {
  if (!payload || typeof payload !== 'object') return {};
  const filtered = {};
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_SETTINGS.has(key)) continue;
    filtered[key] = payload[key];
  }
  return filtered;
};

const getTenantProfile = (req, res) => {
  res.json({ success: true, data: req.tenant });
};

const getTenantSettings = (req, res) => {
  res.json({ success: true, data: req.tenant?.settings || {} });
};

const updateTenantSettings = async (req, res, next) => {
  try {
    const incoming = req.body?.settings;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings payload is required.' });
    }

    const filtered = filterSettings(incoming);
    if (filtered.supportContacts) {
      filtered.supportContacts = {
        ...req.tenant?.settings?.supportContacts,
        ...filtered.supportContacts
      };
    }

    if (filtered.cartRecoveryTemplate !== undefined) {
      filtered.cartRecoveryTemplate = (filtered.cartRecoveryTemplate || '').trim();
    }

    if (filtered.taxLabel !== undefined) {
      filtered.taxLabel = (filtered.taxLabel || '').trim();
    }

    if (filtered.statusEmailTemplates) {
      filtered.statusEmailTemplates = {
        ...req.tenant?.settings?.statusEmailTemplates,
        ...filtered.statusEmailTemplates
      };
    }

    if (filtered.loyalty) {
      filtered.loyalty = {
        ...req.tenant?.settings?.loyalty,
        ...filtered.loyalty
      };
    }

    if (filtered.shipping) {
      const existingShipping = {
        ...DEFAULT_SHIPPING_CONFIG,
        ...(req.tenant?.settings?.shipping || {})
      };
      const mergedOrigin = {
        ...existingShipping.origin,
        ...(filtered.shipping.origin || {})
      };
      const mergedRates = {
        ...existingShipping.rates,
        ...(filtered.shipping.rates || {})
      };
      filtered.shipping = {
        ...existingShipping,
        ...filtered.shipping,
        origin: mergedOrigin,
        rates: mergedRates
      };
      const threshold = Number(filtered.shipping.freeShippingThreshold ?? existingShipping.freeShippingThreshold);
      const flatFee = Number(filtered.shipping.flatShippingFee ?? existingShipping.flatShippingFee);
      filtered.shipping.freeShippingThreshold = !Number.isNaN(threshold) ? Math.max(0, threshold) : existingShipping.freeShippingThreshold;
      filtered.shipping.flatShippingFee = !Number.isNaN(flatFee) ? Math.max(0, flatFee) : existingShipping.flatShippingFee;
      filtered.shipping.origin = {
        country: (filtered.shipping.origin?.country || existingShipping.origin.country || '').trim(),
        state: (filtered.shipping.origin?.state || existingShipping.origin.state || '').trim(),
        city: (filtered.shipping.origin?.city || existingShipping.origin.city || '').trim()
      };
      const sanitizedRates = {};
      ['sameCity', 'sameState', 'outOfState', 'international'].forEach((key) => {
        const amount = Number(filtered.shipping.rates?.[key] ?? existingShipping.rates?.[key] ?? 0);
        sanitizedRates[key] = (!Number.isNaN(amount) && amount >= 0) ? amount : (existingShipping.rates?.[key] ?? 0);
      });
      filtered.shipping.rates = sanitizedRates;
      const allowedPinModes = new Set(['postal', 'city', 'state', 'country']);
      const sanitizedPinMode = filtered.shipping.pinValidationMode || existingShipping.pinValidationMode;
      filtered.shipping.pinValidationMode = allowedPinModes.has(sanitizedPinMode) ? sanitizedPinMode : existingShipping.pinValidationMode;
    }

    const updatedSettings = {
      ...req.tenant?.settings,
      ...filtered
    };

    if (filtered.invoiceTemplate !== undefined) {
      const templateBody = filtered.invoiceTemplate?.trim();
      filtered.invoiceTemplate = templateBody || filtered.invoiceTemplate;
      let template = await InvoiceTemplate.findOne({ where: { tenantId: req.tenant.id } });
      if (!template) {
        template = await InvoiceTemplate.create({
          tenantId: req.tenant.id,
          name: 'Default Invoice',
          body: templateBody || filtered.invoiceTemplate,
          createdBy: req.user.id,
          updatedBy: req.user.id
        });
      } else {
        await template.update({
          body: templateBody || template.body,
          updatedBy: req.user.id
        });
      }
    }

    await req.tenant.update({ settings: updatedSettings, updatedBy: req.user.id });
    res.json({ success: true, data: { settings: updatedSettings } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTenantProfile, getTenantSettings, updateTenantSettings };
