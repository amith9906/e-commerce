'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const EmailTemplate = sequelize.define(
  'EmailTemplate',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    templateType: { type: DataTypes.STRING, allowNull: false, field: 'template_type' },
    name: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    placeholders: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'tenant_email_templates' }
);

module.exports = EmailTemplate;
