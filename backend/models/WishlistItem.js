'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const WishlistItem = sequelize.define('WishlistItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
  ...auditFields
}, { ...auditOptions, tableName: 'wishlist_items' });

module.exports = WishlistItem;
