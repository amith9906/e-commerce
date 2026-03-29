'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Store = sequelize.define(
  'Store',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.JSONB, allowNull: true },
    contactName: { type: DataTypes.STRING, allowNull: true, field: 'contact_name' },
    contactPhone: { type: DataTypes.STRING, allowNull: true, field: 'contact_phone' },
    status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
    type: { type: DataTypes.ENUM('offline', 'online', 'warehouse'), defaultValue: 'offline' },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'stores' }
);

module.exports = Store;
