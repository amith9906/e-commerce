'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Coupon = sequelize.define(
  'Coupon',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    code: { type: DataTypes.STRING, allowNull: false },
    discountType: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false, field: 'discount_type' },
    discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'discount_value' },
    minOrderAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'min_order_amount' },
    maxDiscountAmount: { type: DataTypes.DECIMAL(10, 2), field: 'max_discount_amount' },
    startDate: { type: DataTypes.DATE, allowNull: false, field: 'start_date' },
    endDate: { type: DataTypes.DATE, allowNull: false, field: 'end_date' },
    usageLimit: { type: DataTypes.INTEGER, defaultValue: 0, field: 'usage_limit' },
    usageCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'usage_count' },
    isSpecificUser: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_specific_user' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'coupons' }
);

module.exports = Coupon;
