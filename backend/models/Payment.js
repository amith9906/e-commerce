'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Payment = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    paymentMethod: { type: DataTypes.STRING, field: 'payment_method' },
    transactionRef: { type: DataTypes.STRING, field: 'transaction_ref' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'payments' }
);

module.exports = Payment;
