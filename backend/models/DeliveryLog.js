'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const DeliveryLog = sequelize.define(
  'DeliveryLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    transferId: { type: DataTypes.UUID, allowNull: false, field: 'transfer_id' },
    salesPersonId: { type: DataTypes.UUID, allowNull: false, field: 'sales_person_id' },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'delivered'
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    latitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    proofUrl: { type: DataTypes.STRING, allowNull: true, field: 'proof_url' },
    signatureUrl: { type: DataTypes.STRING, allowNull: true, field: 'signature_url' },
    deliveredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'delivered_at' },
    ...auditFields,
  },
  {
    ...auditOptions,
    tableName: 'delivery_logs'
  }
);

module.exports = DeliveryLog;
