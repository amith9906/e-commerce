'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const POSReceiptItem = sequelize.define(
  'POSReceiptItem',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    posReceiptId: { type: DataTypes.UUID, allowNull: false, field: 'pos_receipt_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: 'unit_price' },
    discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: 'discount_amount' },
    taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'tax_rate' },
    lineTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'line_total' },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'pos_receipt_items' }
);

module.exports = POSReceiptItem;
