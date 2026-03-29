'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: true, field: 'tenant_id' }, // null for superadmin
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
    role: {
      type: DataTypes.ENUM('superadmin', 'admin', 'store_manager', 'salesperson', 'customer'),
      defaultValue: 'customer'
    },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_verified' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    phone: { type: DataTypes.STRING, allowNull: true },
    employeeCode: { type: DataTypes.STRING, allowNull: true, field: 'employee_code' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'users' }
);

module.exports = User;
