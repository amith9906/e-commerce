'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesPersonPerformanceSummary = sequelize.define(
  'SalesPersonPerformanceSummary',
  {
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    salesPersonId: { type: DataTypes.UUID, allowNull: false, field: 'sales_person_id' },
    totalUnits: { type: DataTypes.INTEGER, allowNull: false, field: 'total_units', defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, field: 'total_amount', defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at', defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at', defaultValue: DataTypes.NOW }
  },
  {
    tableName: 'sales_person_performance_summaries',
    timestamps: false
  }
);

module.exports = SalesPersonPerformanceSummary;
