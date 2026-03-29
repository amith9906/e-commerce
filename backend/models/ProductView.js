'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const ProductView = sequelize.define(
  'ProductView',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'product_views' }
);

module.exports = ProductView;
