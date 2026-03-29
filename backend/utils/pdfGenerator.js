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

const createInvoicePdfBuffer = async (content, metadata = {}) => {
  const doc = new PDFDocument({ margin: 40 });
  const passthrough = new PassThrough();
  doc.pipe(passthrough);
  doc.fontSize(12).font('Helvetica');

  doc.text(metadata.companyName || 'Invoice', { align: 'center', underline: true });
  doc.moveDown();

  const lines = content.split('\n');
  lines.forEach((line) => {
    doc.text(line);
  });

  doc.moveDown();
  doc.text(`Generated: ${metadata.generatedAt || new Date().toLocaleString()}`);
  doc.end();

  return streamToBuffer(passthrough);
};

module.exports = { createInvoicePdfBuffer };
