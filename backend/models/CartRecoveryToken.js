'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const CartRecoveryToken = sequelize.define(
  'CartRecoveryToken',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    token: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('sent', 'claimed', 'expired'),
      defaultValue: 'sent'
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'cart_recovery_tokens' }
);

module.exports = CartRecoveryToken;
