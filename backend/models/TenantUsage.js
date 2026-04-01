'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditOptions } = require('./baseModel');

const TenantUsage = sequelize.define(
  'TenantUsage',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'tenant_id' },
    productCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'product_count' },
    storeCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'store_count' },
    userCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'user_count' },
    ordersThisMonth: { type: DataTypes.INTEGER, defaultValue: 0, field: 'orders_this_month' },
    apiCallsThisMinute: { type: DataTypes.INTEGER, defaultValue: 0, field: 'api_calls_this_minute' },
    apiCallsLastReset: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'api_calls_last_reset' },
    storageMb: { type: DataTypes.FLOAT, defaultValue: 0, field: 'storage_mb' },
    lastOrderMonthReset: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'last_order_month_reset' },
  },
  { ...auditOptions, tableName: 'tenant_usage' }
);

module.exports = TenantUsage;
