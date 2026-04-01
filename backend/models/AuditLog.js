'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: true, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    userEmail: { type: DataTypes.STRING, allowNull: true, field: 'user_email' },
    userRole: { type: DataTypes.STRING, allowNull: true, field: 'user_role' },
    action: { type: DataTypes.STRING, allowNull: false }, // e.g. 'product.create', 'order.cancel'
    entity: { type: DataTypes.STRING, allowNull: true },  // e.g. 'Product', 'Order'
    entityId: { type: DataTypes.STRING, allowNull: true, field: 'entity_id' },
    method: { type: DataTypes.STRING, allowNull: true },  // HTTP method
    path: { type: DataTypes.STRING, allowNull: true },    // request path
    ipAddress: { type: DataTypes.STRING, allowNull: true, field: 'ip_address' },
    userAgent: { type: DataTypes.STRING, allowNull: true, field: 'user_agent' },
    requestBody: { type: DataTypes.JSONB, allowNull: true, field: 'request_body' },
    responseStatus: { type: DataTypes.INTEGER, allowNull: true, field: 'response_status' },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false, // audit logs are immutable
  }
);

module.exports = AuditLog;
