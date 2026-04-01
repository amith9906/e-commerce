'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Ticket = sequelize.define(
  'Ticket',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    title: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      defaultValue: 'open',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'tickets' }
);

module.exports = Ticket;
