'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Stock = sequelize.define(
  'Stock',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5, field: 'low_stock_threshold' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'stock' }
);

module.exports = Stock;
