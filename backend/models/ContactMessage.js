'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const ContactMessage = sequelize.define(
  'ContactMessage',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    subject: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { 
      type: DataTypes.ENUM('new', 'read', 'resolved'), 
      defaultValue: 'new' 
    },
    adminNotes: { type: DataTypes.TEXT, field: 'admin_notes' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'contact_messages' }
);

module.exports = ContactMessage;
