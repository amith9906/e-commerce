'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketMessage = sequelize.define(
  'TicketMessage',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    ticketId: { type: DataTypes.UUID, allowNull: false, field: 'ticket_id' },
    senderType: { type: DataTypes.ENUM('customer', 'admin'), allowNull: false, field: 'sender_type' },
    senderId: { type: DataTypes.UUID, allowNull: true, field: 'sender_id' },
    body: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: DataTypes.JSONB, defaultValue: [], allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
  },
  { tableName: 'ticket_messages', timestamps: false }
);

module.exports = TicketMessage;
