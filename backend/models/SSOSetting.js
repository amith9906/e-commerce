'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const SSOSetting = sequelize.define(
  'SSOSetting',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    provider: { type: DataTypes.STRING, allowNull: false },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    clientId: { type: DataTypes.STRING, allowNull: false, field: 'client_id' },
    clientSecret: { type: DataTypes.STRING, allowNull: false, field: 'client_secret' },
    redirectUri: { type: DataTypes.STRING, allowNull: true, field: 'redirect_uri' },
    scopes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'tenant_sso_settings' }
);

module.exports = SSOSetting;
