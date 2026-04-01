'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const OrderReturn = sequelize.define(
  'OrderReturn',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
    type: { type: DataTypes.ENUM('return', 'replacement'), defaultValue: 'return' },
    reason: { type: DataTypes.TEXT, allowNull: false },
    customerComment: { type: DataTypes.TEXT, allowNull: true, field: 'customer_comment' },
    attachments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'), defaultValue: 'pending' },
    adminNotes: { type: DataTypes.TEXT, field: 'admin_notes' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'order_returns' }
);

module.exports = OrderReturn;
