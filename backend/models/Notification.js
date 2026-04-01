'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' }, // null = broadcast
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_read' },
    referenceId: { type: DataTypes.UUID, allowNull: true, field: 'reference_id' },
    type: { type: DataTypes.ENUM('info', 'warning', 'success', 'broadcast'), defaultValue: 'info' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'notifications' }
);

module.exports = Notification;
