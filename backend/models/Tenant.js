'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Tenant = sequelize.define(
  'Tenant',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    plan: { type: DataTypes.STRING, defaultValue: 'free' },
    status: { type: DataTypes.ENUM('active', 'suspended', 'deleted'), defaultValue: 'active' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'tenants' }
);

module.exports = Tenant;
