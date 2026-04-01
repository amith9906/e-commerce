'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const PricingRule = sequelize.define(
  'PricingRule',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    minQuantity: { type: DataTypes.INTEGER, allowNull: false, field: 'min_quantity', defaultValue: 1 },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    label: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    startDate: { type: DataTypes.DATE, allowNull: true, field: 'start_date' },
    endDate: { type: DataTypes.DATE, allowNull: true, field: 'end_date' },
    productId: { type: DataTypes.UUID, allowNull: true, field: 'product_id' },
    storeId: { type: DataTypes.UUID, allowNull: true, field: 'store_id' },
    ...auditFields,
  },
  {
    ...auditOptions,
    tableName: 'pricing_rules'
  }
);

module.exports = PricingRule;
