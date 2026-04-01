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
  'loyalty',
  'companyName',
  'companyAddress',
  'gstin',
  'companyWebsite',
  'invoiceNotes'
]);

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
