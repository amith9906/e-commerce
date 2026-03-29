'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const StoreStock = sequelize.define(
  'StoreStock',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5, field: 'low_stock_threshold' },
    lastReceivedAt: { type: DataTypes.DATE, field: 'last_received_at' },
    ...auditFields,
  },
  {
    ...auditOptions,
    tableName: 'store_stock',
    indexes: [
      { unique: true, fields: ['store_id', 'product_id'] },
    ],
  }
);

module.exports = StoreStock;
