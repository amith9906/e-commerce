'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    category: { type: DataTypes.STRING },
    brand: { type: DataTypes.STRING },
    color: { type: DataTypes.STRING },
    size: { type: DataTypes.STRING },
    sku: { type: DataTypes.STRING },
    images: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    specifications: { type: DataTypes.JSONB, defaultValue: {} },
    highlights: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'products' }
);

module.exports = Product;
