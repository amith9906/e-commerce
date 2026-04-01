'use strict';
const { InvoiceTemplate } = require('../../models');
const { defaultTemplate, renderInvoiceContent, buildInvoiceContext, createInvoiceNumber } = require('../../utils/invoiceTemplate');
const { createInvoicePdfBuffer } = require('../../utils/pdfGenerator');
const { resolveTaxConfig } = require('../../utils/tax');

const ensureTemplate = async (tenant, defaults) => {
  let template = await InvoiceTemplate.findOne({ where: { tenantId: tenant.id } });
  if (!template) {
    template = await InvoiceTemplate.create({
      tenantId: tenant.id,
      name: 'Default Invoice',
      body: defaults.body || defaultTemplate,
      createdBy: defaults.userId,
      updatedBy: defaults.userId
    });
  }
  return template;
};

const PREVIEW_ITEMS = [
  { product: { name: 'Wireless Headset' }, quantity: 1, unitPrice: 2450 },
  { product: { name: 'Protective Carry Case' }, quantity: 2, unitPrice: 650 }
];

const buildPreviewContext = (tenant) => {
  const subtotalValue = PREVIEW_ITEMS.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const shippingFeeValue = 99;
  const discountValue = 250;
  const { rate: taxRateValue, label: taxLabelValue } = resolveTaxConfig({ tenant, region: null });

  return buildInvoiceContext({
    tenant,
    invoiceNumber: createInvoiceNumber(),
    orderId: `PREVIEW-${Date.now()}`,
    orderDate: new Date().toLocaleDateString(),
    customer: { name: 'Jane Doe', email: 'jane.doe@example.com', phone: '+91 98765 43210' },
    shippingAddress: '12 Sample Street, Mumbai, India',
    items: PREVIEW_ITEMS,
    subtotalValue,
    shippingFeeValue,
    discountValue,
    taxRateValue,
    taxLabelValue,
    paymentMethodLabel: (tenant?.settings?.paymentGateway || 'Mock Gateway').replace(/_/g, ' '),
    notes: tenant?.settings?.invoiceNotes || 'This preview uses sample order details and the current template body.'
  });
};

const getTemplate = async (req, res, next) => {
  try {
    const template = await ensureTemplate(req.tenant, { userId: req.user.id });
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { name, body } = req.body;
    if (!body) {
      return res.status(400).json({ success: false, message: 'Template body is required.' });
    }

    const template = await ensureTemplate(req.tenant, { userId: req.user.id, body });
    await template.update({
      name: name || template.name,
      body,
      updatedBy: req.user.id
    });

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

const previewTemplate = async (req, res, next) => {
  try {
    const overrideBody = req.body?.body;
    const template = await ensureTemplate(req.tenant, { userId: req.user.id, body: overrideBody });
    const templateBody = overrideBody || template.body || defaultTemplate;
    const context = buildPreviewContext(req.tenant);
    const content = renderInvoiceContent(templateBody, context);
    res.json({ success: true, data: { content, metadata: context } });
  } catch (err) {
    next(err);
  }
};

const previewTemplatePdf = async (req, res, next) => {
  try {
    const ctx = buildPreviewContext(req.tenant);
    const buffer = await createInvoicePdfBuffer(ctx, PREVIEW_ITEMS);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice-preview.pdf"');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplate, updateTemplate, previewTemplate, previewTemplatePdf };
