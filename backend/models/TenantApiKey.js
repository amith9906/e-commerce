'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const TenantApiKey = sequelize.define(
  'TenantApiKey',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    label: { type: DataTypes.STRING, allowNull: false },
    keyId: { type: DataTypes.STRING, allowNull: false, field: 'key_id' },
    secretHash: { type: DataTypes.STRING, allowNull: false, field: 'secret_hash' },
    status: { type: DataTypes.ENUM('active', 'revoked'), allowNull: false, defaultValue: 'active' },
    expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true, field: 'last_used_at' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'tenant_api_keys' }
);

module.exports = TenantApiKey;
