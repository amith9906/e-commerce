'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const GiftCard = sequelize.define(
  'GiftCard',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'gift_cards' }
);

module.exports = GiftCard;
