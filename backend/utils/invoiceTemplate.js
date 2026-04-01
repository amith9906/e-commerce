'use strict';
const { sanitizeLabel } = require('./tax');
const defaultTemplate = `
{{companyName}}
{{companyAddress}}
Email: {{supportEmail}}
Phone: {{supportPhone}}

Invoice #: {{invoiceNumber}}         Order ID: {{orderId}}
Date: {{orderDate}}

Bill To:
  {{customerName}}
  {{customerEmail}}
  {{customerPhone}}

Shipping Address:
  {{shippingAddress}}

-------------------------------------------------------------------------- 
| Description                     | Qty | Rate     | Amount     |
-------------------------------------------------------------------------- 
{{itemsList}}
-------------------------------------------------------------------------- 
| Subtotal                        |     |          | {{subTotal}}     |
| Discount                        |     |          | {{discountAmount}}     |
| Net Amount                      |     |          | {{netAmount}}     |
| {{taxLabel}} ({{taxRate}}%)              |     |          | {{taxAmount}}     |
| Shipping                        |     |          | {{shippingFee}}     |
-------------------------------------------------------------------------- 
| Total Amount (Before Gift Card) |     |          | {{totalAmount}}     |
| Gift Card Credit               |     |          | {{giftCardDeduction}}     |
| Points Credit                  |     |          | {{pointsDeduction}}     |
| Amount Due (After Credits)      |     |          | {{amountDue}}     |
-------------------------------------------------------------------------- 
| Points Earned                  |     |          | {{pointsEarned}}     |
-------------------------------------------------------------------------- 

Payment Details: {{paymentMethodLabel}}

Notes:
{{notes}}

Need help? Reach us at {{supportEmail}} or {{supportPhone}}.
`;

const formatCurrency = (value, currency = 'INR') => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatCurrencyWithTenant = (value, currency = 'INR') => formatCurrency(value, currency);

const buildItemsList = (items = [], currency = 'INR') => {
  const pad = (value, length, align = 'left') => {
    const str = String(value ?? '');
    return align === 'right' ? str.padStart(length, ' ') : str.padEnd(length, ' ');
  };

  return items
    .map((item) => {
      const name = pad(item.product?.name || 'Product', 30);
      const qty = pad(item.quantity ?? 0, 3, 'right');
      const rate = pad(formatCurrency(Number(item.unitPrice) || 0, currency), 12, 'right');
      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const amount = pad(formatCurrency(lineTotal, currency), 15, 'right');
      return `| ${name} | ${qty} | ${rate} | ${amount} |`;
    })
    .join('\n');
};

const buildInvoiceContext = ({
  tenant,
  invoiceNumber,
  orderId,
  orderDate,
  customer,
  shippingAddress,
  items,
  subtotalValue,
  shippingFeeValue,
  discountValue,
  taxRateValue,
  taxLabelValue,
  paymentMethodLabel,
  notes,
  currencyCode,
  giftCardDeductionValue,
  pointsDeductionValue,
  pointsEarnedValue,
  amountDueValue
}) => {
  const currency = currencyCode || tenant?.settings?.currency || 'INR';
  const supportContacts = tenant?.settings?.supportContacts || {};
  const supportEmail = supportContacts.email || 'support@example.com';
  const supportPhone = supportContacts.phone || '+91 0000000000';
  const companyAddress = tenant?.settings?.companyAddress || (tenant?.slug?.replace('-', ' ') || 'Head Office');
  const taxRate = Number.isFinite(Number(taxRateValue)) ? Number(taxRateValue) : Number(tenant?.settings?.taxRate || 0);
  const fallbackTaxLabel = sanitizeLabel(tenant?.settings?.taxLabel, 'Tax');
  const taxLabel = sanitizeLabel(taxLabelValue, fallbackTaxLabel);
  const subtotal = Number(subtotalValue) || 0;
  const discount = Number(discountValue) || 0;
  const shippingFee = Number(shippingFeeValue) || 0;
  const netAmount = Math.max(subtotal - discount, 0);
  const taxAmount = taxRate > 0 ? (netAmount * taxRate) / 100 : 0;
  const totalAmount = netAmount + taxAmount + shippingFee;
  const giftCardDeduction = Number.isFinite(Number(giftCardDeductionValue))
    ? Number(giftCardDeductionValue)
    : 0;
  const pointsDeduction = Number.isFinite(Number(pointsDeductionValue))
    ? Number(pointsDeductionValue)
    : 0;
  const pointsEarned = Number.isFinite(Number(pointsEarnedValue))
    ? Number(pointsEarnedValue)
    : 0;
  const amountDue = Number.isFinite(Number(amountDueValue))
    ? Number(amountDueValue)
    : Math.max(totalAmount - giftCardDeduction - pointsDeduction, 0);

  return {
    companyName: tenant?.settings?.companyName || tenant?.name || 'Our Store',
    companyAddress,
    gstin: tenant?.settings?.gstin || null,
    companyWebsite: tenant?.settings?.companyWebsite || null,
    companyContact: supportEmail,
    supportEmail,
    supportPhone,
    invoiceNumber,
    orderId,
    orderDate,
    customerName: customer?.name || customer?.email || 'Valued Customer',
    customerEmail: customer?.email || 'customer@example.com',
    customerPhone: customer?.phone || 'Not provided',
    shippingAddress: shippingAddress || 'Not provided',
    subTotal: formatCurrencyWithTenant(subtotal, currency),
    discountAmount: formatCurrencyWithTenant(discount, currency),
    netAmount: formatCurrencyWithTenant(netAmount, currency),
    taxAmount: formatCurrencyWithTenant(taxAmount, currency),
    taxRate: taxRate.toFixed(2),
    taxLabel,
    shippingFee: formatCurrencyWithTenant(shippingFee, currency),
    totalAmount: formatCurrencyWithTenant(totalAmount, currency),
    giftCardDeduction: formatCurrencyWithTenant(giftCardDeduction, currency),
    pointsDeduction: formatCurrencyWithTenant(pointsDeduction, currency),
    pointsEarned: formatCurrencyWithTenant(pointsEarned, currency),
    amountDue: formatCurrencyWithTenant(amountDue, currency),
    paymentMethodLabel: paymentMethodLabel || 'Online Payment',
    notes: notes || 'Thank you for your purchase!',
    currency,
    itemsList: buildItemsList(items, currency),
  };
};

const renderInvoiceContent = (templateBody, data) => {
  return templateBody.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return data[key] ?? '';
    }
    return '';
  });
};

const createInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}`;

module.exports = {
  defaultTemplate,
  formatCurrency,
  formatCurrencyWithTenant,
  buildItemsList,
  buildInvoiceContext,
  renderInvoiceContent,
  createInvoiceNumber
};
