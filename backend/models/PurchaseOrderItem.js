'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const PurchaseOrderItem = sequelize.define(
  'PurchaseOrderItem',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    purchaseOrderId: { type: DataTypes.UUID, allowNull: false, field: 'purchase_order_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    receivedQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'received_quantity' },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: 'unit_price' },
    taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'tax_rate' },
    taxAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: 'tax_amount' },
    lineTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'line_total' },
    metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'purchase_order_items' }
);

module.exports = PurchaseOrderItem;
