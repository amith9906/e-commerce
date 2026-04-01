'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Supplier = sequelize.define(
  'Supplier',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    contactName: { type: DataTypes.STRING, allowNull: true, field: 'contact_name' },
    address: { type: DataTypes.JSONB, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'suppliers' }
);

module.exports = Supplier;
