'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const ProductReview = sequelize.define(
  'ProductReview',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    rating: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: { min: 1, max: 5 } 
    },
    comment: { type: DataTypes.TEXT },
    images: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    isVerifiedPurchase: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_verified_purchase' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'product_reviews' }
);

module.exports = ProductReview;
