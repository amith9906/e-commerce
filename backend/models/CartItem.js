'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const CartItem = sequelize.define('CartItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  size: { type: DataTypes.STRING, allowNull: true },
  color: { type: DataTypes.STRING, allowNull: true },
  ...auditFields
}, { ...auditOptions, tableName: 'cart_items' });

module.exports = CartItem;
