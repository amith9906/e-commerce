'use strict';
const { PassThrough } = require('stream');
const PDFDocument = require('pdfkit');

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

/**
 * Generates a structured invoice PDF from a context object.
 * @param {Object} ctx  - Output of buildInvoiceContext()
 * @param {Array}  items - Raw order items array (with product.name, quantity, unitPrice)
 */
const createInvoicePdfBuffer = async (ctx, items = []) => {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  const pass = new PassThrough();
  doc.pipe(pass);

  const PRIMARY = '#4338ca';
  const TEXT    = '#1e293b';
  const MUTED   = '#64748b';
  const BORDER  = '#e2e8f0';
  const pageW   = doc.page.width - 90; // usable width (margins 45 each side)

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // Company name (left)
  doc.font('Helvetica-Bold').fontSize(16).fillColor(TEXT)
    .text(ctx.companyName || 'Invoice', 45, 45, { continued: false });

  // "INVOICE" badge (right)
  doc.font('Helvetica-Bold').fontSize(22).fillColor(PRIMARY)
    .text('INVOICE', 0, 40, { align: 'right' });

  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  const companyLines = [
    ctx.companyAddress,
    ctx.gstin ? `GSTIN: ${ctx.gstin}` : null,
    ctx.supportEmail ? `Email: ${ctx.supportEmail}` : null,
    ctx.supportPhone ? `Phone: ${ctx.supportPhone}` : null,
    ctx.companyWebsite || null,
  ].filter(Boolean);

  let leftY = doc.y + 4;
  companyLines.forEach((line) => {
    doc.text(line, 45, leftY);
    leftY += 13;
  });

  // Invoice meta (right-aligned)
  const metaLines = [
    [`Invoice #:`, ctx.invoiceNumber || '—'],
    [`Order ID:`,  `#${String(ctx.orderId || '').slice(0, 8).toUpperCase()}`],
    [`Date:`,      ctx.orderDate || new Date().toLocaleDateString('en-IN')],
  ];
  let metaY = 65;
  metaLines.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, 0, metaY, { align: 'right', width: doc.page.width - 45 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT).text(value, 0, metaY, { align: 'right', width: doc.page.width - 45 });
    metaY += 14;
  });

  const dividerY = Math.max(leftY, metaY) + 8;

  // ── DIVIDER ──────────────────────────────────────────────────────────────────
  doc.moveTo(45, dividerY).lineTo(doc.page.width - 45, dividerY)
    .strokeColor(PRIMARY).lineWidth(2).stroke();

  // ── BILL TO / SHIP TO ───────────────────────────────────────────────────────
  const addrY = dividerY + 14;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
    .text('BILL TO', 45, addrY)
    .text('SHIP TO', doc.page.width / 2, addrY);

  const billLines = [
    ctx.customerName,
    ctx.customerEmail,
    ctx.customerPhone !== 'Not provided' ? ctx.customerPhone : null,
  ].filter(Boolean);

  const shipLines = (ctx.shippingAddress || '').split(',').map(s => s.trim()).filter(Boolean);

  let billY = addrY + 12;
  billLines.forEach((line) => {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT).text(line, 45, billY, { width: pageW / 2 - 10 });
    billY += 13;
  });

  let shipY = addrY + 12;
  shipLines.forEach((line) => {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT).text(line, doc.page.width / 2, shipY, { width: pageW / 2 });
    shipY += 13;
  });

  // ── ITEMS TABLE ──────────────────────────────────────────────────────────────
  const tableY = Math.max(billY, shipY) + 16;

  const colX   = [45, 270, 355, 430, 510];
  const colW   = [220, 80,  70,  75,  60];
  const headers = ['Item Description', 'Qty', 'Unit Price', 'Amount', ''];

  // Table header background
  doc.rect(45, tableY, pageW, 20).fill('#f1f5f9');

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155');
  ['Item Description', 'Qty', 'Unit Price', 'Amount'].forEach((h, i) => {
    const align = i === 0 ? 'left' : 'right';
    doc.text(h, colX[i] + 4, tableY + 5, { width: colW[i], align });
  });

  // Bottom border of header
  doc.moveTo(45, tableY + 20).lineTo(doc.page.width - 45, tableY + 20)
    .strokeColor(BORDER).lineWidth(1).stroke();

  let rowY = tableY + 22;
  const currency = ctx.currency || 'INR';

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(n) || 0);

  (items.length > 0 ? items : []).forEach((item, idx) => {
    const name      = item.product?.name || 'Product';
    const qty       = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const lineTotal = qty * unitPrice;
    const rowBg     = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

    doc.rect(45, rowY, pageW, 18).fill(rowBg);

    doc.font('Helvetica').fontSize(9).fillColor(TEXT);
    doc.text(name,           colX[0] + 4, rowY + 4, { width: colW[0] - 8 });
    doc.text(String(qty),    colX[1] + 4, rowY + 4, { width: colW[1], align: 'right' });
    doc.text(fmt(unitPrice), colX[2] + 4, rowY + 4, { width: colW[2], align: 'right' });
    doc.text(fmt(lineTotal), colX[3] + 4, rowY + 4, { width: colW[3], align: 'right' });

    doc.moveTo(45, rowY + 18).lineTo(doc.page.width - 45, rowY + 18)
      .strokeColor(BORDER).lineWidth(0.5).stroke();

    rowY += 18;
  });

  // ── TOTALS ───────────────────────────────────────────────────────────────────
  const totalsX = 355;
  const totalsLabelW = 100;
  const totalsValW   = 100;
  let totY = rowY + 10;

  const totRows = [
    ['Subtotal',                                   ctx.subTotal],
    ctx.discountAmount && ctx.discountAmount !== fmt(0) ? ['Discount', `- ${ctx.discountAmount}`] : null,
    [`${ctx.taxLabel || 'Tax'} (${ctx.taxRate || 0}%)`, ctx.taxAmount],
    ['Shipping',                                   ctx.shippingFee],
    ctx.giftCardDeduction && ctx.giftCardDeduction !== fmt(0) ? ['Gift Card Credit', `- ${ctx.giftCardDeduction}`] : null,
    ctx.pointsDeduction && ctx.pointsDeduction !== fmt(0) ? ['Points Credit', `- ${ctx.pointsDeduction}`] : null,
  ].filter(Boolean);

  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  totRows.forEach(([label, value]) => {
    doc.text(label, totalsX, totY, { width: totalsLabelW, align: 'right' });
    doc.fillColor(TEXT).text(value || '—', totalsX + totalsLabelW, totY, { width: totalsValW, align: 'right' });
    doc.fillColor(MUTED);
    totY += 14;
  });

  // Total Due row
  totY += 4;
  doc.moveTo(totalsX, totY).lineTo(doc.page.width - 45, totY)
    .strokeColor(PRIMARY).lineWidth(1.5).stroke();
  totY += 6;

  doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY)
    .text('Total Due', totalsX, totY, { width: totalsLabelW, align: 'right' });
  doc.fillColor(TEXT).text(ctx.amountDue || ctx.totalAmount || '—', totalsX + totalsLabelW, totY, { width: totalsValW, align: 'right' });

  // ── PAYMENT METHOD ────────────────────────────────────────────────────────────
  totY += 22;
  doc.font('Helvetica').fontSize(9).fillColor(MUTED)
    .text('Payment Method:', 45, totY);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT)
    .text(ctx.paymentMethodLabel || 'Online Payment', 145, totY);

  // ── NOTES ────────────────────────────────────────────────────────────────────
  if (ctx.notes && ctx.notes !== 'No additional notes') {
    totY += 18;
    doc.rect(45, totY, pageW, 1).fill(BORDER);
    totY += 8;
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED)
      .text(ctx.notes, 45, totY, { width: pageW });
    totY = doc.y + 4;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────────
  const footerY = doc.page.height - 50;
  doc.moveTo(45, footerY).lineTo(doc.page.width - 45, footerY)
    .strokeColor(BORDER).lineWidth(0.5).stroke();

  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    .text(
      `${ctx.companyName || ''} · This is a computer-generated invoice and does not require a physical signature.`,
      45, footerY + 6, { align: 'center', width: pageW }
    );

  doc.end();
  return streamToBuffer(pass);
};

module.exports = { createInvoicePdfBuffer };
