'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const ProductQuestion = sequelize.define(
  'ProductQuestion',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    question: { type: DataTypes.TEXT, allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'published', 'hidden'),
      defaultValue: 'pending',
      allowNull: false
    },
    answeredBy: { type: DataTypes.UUID, allowNull: true, field: 'answered_by' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'product_questions' }
);

module.exports = ProductQuestion;
