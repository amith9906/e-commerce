'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const UserAddress = sequelize.define(
  'UserAddress',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    label: { type: DataTypes.STRING, defaultValue: 'Home' }, // e.g. Home, Office, Other
    fullName: { type: DataTypes.STRING, allowNull: false, field: 'full_name' },
    phone: { type: DataTypes.STRING },
    addressLine1: { type: DataTypes.STRING, allowNull: false, field: 'address_line1' },
    addressLine2: { type: DataTypes.STRING, field: 'address_line2' },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING },
    postalCode: { type: DataTypes.STRING, field: 'postal_code' },
    country: { type: DataTypes.STRING, allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'user_addresses' }
);

module.exports = UserAddress;
