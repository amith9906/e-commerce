'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const DeliveryRegion = sequelize.define(
  'DeliveryRegion',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    leadTimeDays: { type: DataTypes.INTEGER, allowNull: true, field: 'lead_time_days' },
    locations: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'tax_rate' },
    taxLabel: { type: DataTypes.STRING, allowNull: true, field: 'tax_label' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'delivery_regions' }
);

module.exports = DeliveryRegion;
