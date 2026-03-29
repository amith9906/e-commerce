'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const CommissionSetting = sequelize.define(
  'CommissionSetting',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    salesPersonId: { type: DataTypes.UUID, allowNull: true, field: 'sales_person_id' },
    percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 5.0 },
    flatAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, field: 'flat_amount' },
    description: { type: DataTypes.STRING, allowNull: true },
    ...auditFields,
  },
  {
    ...auditOptions,
    tableName: 'commission_settings',
    indexes: [{ fields: ['tenant_id', 'sales_person_id'] }]
  }
);

module.exports = CommissionSetting;
