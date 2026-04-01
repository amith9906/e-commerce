'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const POSReceipt = sequelize.define(
  'POSReceipt',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
    salespersonId: { type: DataTypes.UUID, allowNull: true, field: 'salesperson_id' },
    status: { type: DataTypes.ENUM('pending', 'paid', 'cancelled'), allowNull: false, defaultValue: 'pending' },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'INR' },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'total_amount' },
    taxAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'tax_amount' },
    discountAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'discount_amount' },
    paidAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'paid_amount' },
    paymentMethod: { type: DataTypes.STRING, allowNull: true, field: 'payment_method' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'pos_receipts' }
);

module.exports = POSReceipt;
