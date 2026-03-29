'use strict';
const defaultTemplate = `Invoice #: {{invoiceNumber}}
Order ID: {{orderId}}
Customer: {{customerName}}
Email: {{customerEmail}}
Order Date: {{orderDate}}
Shipping Address: {{shippingAddress}}

Items:
{{itemsList}}

Total Amount: {{totalAmount}}

Thank you for shopping with us!
`;

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const renderInvoiceContent = (templateBody, data) => {
  return templateBody.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return data[key] ?? '';
    }
    return '';
  });
};

const buildItemsList = (items) =>
  items.map((item) => {
    const lineTotal = Number(item.quantity) * Number(item.unitPrice || 0);
    return `${item.quantity} × ${item.product?.name || 'Product'} @ ${formatCurrency(item.unitPrice)} = ${formatCurrency(lineTotal)}`;
  }).join('\n');

const createInvoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

module.exports = { renderInvoiceContent, defaultTemplate, formatCurrency, buildItemsList, createInvoiceNumber };
