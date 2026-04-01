'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const GiftCardRedemption = sequelize.define(
  'GiftCardRedemption',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    giftCardId: { type: DataTypes.UUID, allowNull: false, field: 'gift_card_id' },
    orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'gift_card_redemptions' }
);

module.exports = GiftCardRedemption;
