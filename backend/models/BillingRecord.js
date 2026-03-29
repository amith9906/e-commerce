'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const BillingRecord = sequelize.define(
  'BillingRecord',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
    transferId: { type: DataTypes.UUID, allowNull: true, field: 'transfer_id' },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'invoice_number' },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'partial'), defaultValue: 'pending', field: 'payment_status' },
    paymentMethod: { type: DataTypes.ENUM('cash', 'bank', 'upi', 'credit'), defaultValue: 'cash', field: 'payment_method' },
    dueDate: { type: DataTypes.DATE, allowNull: true, field: 'due_date' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'billing_records' }
);

module.exports = BillingRecord;
