'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const PurchaseOrder = sequelize.define(
  'PurchaseOrder',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    supplierId: { type: DataTypes.UUID, allowNull: false, field: 'supplier_id' },
    storeId: { type: DataTypes.UUID, allowNull: true, field: 'store_id' },
    orderNumber: { type: DataTypes.STRING, allowNull: false, field: 'order_number' },
    status: {
      type: DataTypes.ENUM('draft', 'ordered', 'partial', 'received', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'INR' },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'total_amount' },
    taxAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'tax_amount' },
    discountAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'discount_amount' },
    expectedDeliveryDate: { type: DataTypes.DATE, allowNull: true, field: 'expected_delivery_date' },
    receivedDate: { type: DataTypes.DATE, allowNull: true, field: 'received_date' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'purchase_orders' }
);

module.exports = PurchaseOrder;
