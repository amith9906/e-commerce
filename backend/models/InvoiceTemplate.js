'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const InvoiceTemplate = sequelize.define(
  'InvoiceTemplate',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Default Invoice' },
    body: { type: DataTypes.TEXT, allowNull: false },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'invoice_templates' }
);

module.exports = InvoiceTemplate;
