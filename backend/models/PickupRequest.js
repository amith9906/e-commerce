'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const PickupRequest = sequelize.define(
  'PickupRequest',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    scheduledFor: { type: DataTypes.DATE, allowNull: false, field: 'scheduled_for' },
    status: { type: DataTypes.ENUM('requested', 'confirmed', 'picked', 'cancelled'), defaultValue: 'requested' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'pickup_requests' }
);

module.exports = PickupRequest;
