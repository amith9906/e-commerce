'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const DeliveryRestriction = sequelize.define(
  'DeliveryRestriction',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    regionId: { type: DataTypes.UUID, allowNull: false, field: 'region_id' },
    productId: { type: DataTypes.UUID, allowNull: true, field: 'product_id' },
    category: { type: DataTypes.STRING, allowNull: true },
    isAllowed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_allowed' },
    minOrderValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'min_order_value' },
    maxWeightKg: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'max_weight_kg' },
    allowReturn: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'allow_return' },
    allowReplacement: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'allow_replacement' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'delivery_restrictions' }
);

module.exports = DeliveryRestriction;
