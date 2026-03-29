'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const SalesPersonAssignment = sequelize.define(
  'SalesPersonAssignment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'salesperson_assignments', indexes: [{ fields: ['tenant_id', 'user_id'] }] }
);

module.exports = SalesPersonAssignment;
