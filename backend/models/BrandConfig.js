'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const BrandConfig = sequelize.define(
  'BrandConfig',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    key: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.TEXT },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'brand_config' }
);

module.exports = BrandConfig;
