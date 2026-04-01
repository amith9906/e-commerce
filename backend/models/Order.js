'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'in_transit', 'delivered', 'delayed', 'cancelled'),
      defaultValue: 'pending',
    },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'total_amount' },
    shippingAddressId: { type: DataTypes.UUID, allowNull: true, field: 'shipping_address_id' }, // FK → user_addresses
    shippingAddressSnapshot: { type: DataTypes.JSONB, allowNull: true, field: 'shipping_address_snapshot' }, // snapshot at order time
    notes: { type: DataTypes.TEXT },
    couponId: { type: DataTypes.UUID, allowNull: true, field: 'coupon_id' },
    discountAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'discount_amount' },
    shippingFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'shipping_fee' },
    taxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'tax_rate' },
    taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'tax_amount' },
    taxLabel: { type: DataTypes.STRING, allowNull: true, field: 'tax_label' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'orders' }
);

module.exports = Order;
