'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const WebhookDelivery = sequelize.define(
  'WebhookDelivery',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantWebhookId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_webhook_id' },
    event: { type: DataTypes.STRING, allowNull: false },
    payload: { type: DataTypes.JSONB, allowNull: true },
    status: { type: DataTypes.ENUM('success', 'failure'), allowNull: false },
    responseCode: { type: DataTypes.INTEGER, allowNull: true, field: 'response_code' },
    responseBody: { type: DataTypes.TEXT, allowNull: true, field: 'response_body' },
    attemptedAt: { type: DataTypes.DATE, allowNull: false, field: 'attempted_at', defaultValue: DataTypes.NOW },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'webhook_deliveries' }
);

module.exports = WebhookDelivery;
