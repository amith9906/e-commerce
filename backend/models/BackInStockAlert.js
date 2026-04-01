'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const BackInStockAlert = sequelize.define(
  'BackInStockAlert',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    email: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'notified', 'cancelled'),
      defaultValue: 'pending'
    },
    notifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'notified_at' },
    note: { type: DataTypes.TEXT, allowNull: true },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'back_in_stock_alerts' }
);

module.exports = BackInStockAlert;
