'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const OrderInvoice = sequelize.define(
  'OrderInvoice',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
    templateId: { type: DataTypes.UUID, allowNull: true, field: 'template_id' },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'invoice_number' },
    content: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('generated', 'sent'), defaultValue: 'generated' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'order_invoices' }
);

module.exports = OrderInvoice;
