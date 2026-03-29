'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreRevenueSummary = sequelize.define(
  'StoreRevenueSummary',
  {
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
    totalRevenue: { type: DataTypes.DECIMAL(18, 2), allowNull: false, field: 'total_revenue', defaultValue: 0 },
    invoiceCount: { type: DataTypes.INTEGER, allowNull: false, field: 'invoice_count', defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at', defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at', defaultValue: DataTypes.NOW }
  },
  {
    tableName: 'store_revenue_summaries',
    timestamps: false
  }
);

module.exports = StoreRevenueSummary;
