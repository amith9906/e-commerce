'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const LoyaltyPoint = sequelize.define(
  'LoyaltyPoint',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    orderId: { type: DataTypes.UUID, allowNull: true, field: 'order_id' },
    points: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM('earned', 'redeemed'),
      allowNull: false,
    },
    reason: { type: DataTypes.STRING, allowNull: true },
    metadata: { type: DataTypes.JSONB, defaultValue: {}, allowNull: false },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'loyalty_points' }
);

module.exports = LoyaltyPoint;
