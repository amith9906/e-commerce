'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const TenantWebhook = sequelize.define(
  'TenantWebhook',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    events: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    secret: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('enabled', 'disabled'), allowNull: false, defaultValue: 'enabled' },
    lastStatus: { type: DataTypes.STRING, allowNull: true, field: 'last_status' },
    lastAttemptedAt: { type: DataTypes.DATE, allowNull: true, field: 'last_attempted_at' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'tenant_webhooks' }
);

module.exports = TenantWebhook;
