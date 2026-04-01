'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Promotion = sequelize.define(
  'Promotion',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    conditionType: { type: DataTypes.ENUM('min_order_amount'), defaultValue: 'min_order_amount', field: 'condition_type' },
    conditionValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'condition_value' },
    discountType: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false, field: 'discount_type' },
    discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'discount_value' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    bannerImage: { type: DataTypes.STRING, allowNull: true, field: 'banner_image' },
    ctaText: { type: DataTypes.STRING, allowNull: true, field: 'cta_text' },
    ctaUrl: { type: DataTypes.STRING, allowNull: true, field: 'cta_url' },
    validFrom: { type: DataTypes.DATE, allowNull: true, field: 'valid_from' },
    validTo: { type: DataTypes.DATE, allowNull: true, field: 'valid_to' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'promotions' }
);

module.exports = Promotion;
