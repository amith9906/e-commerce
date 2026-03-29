'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const InventoryTransfer = sequelize.define(
  'InventoryTransfer',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    fromStoreId: { type: DataTypes.UUID, allowNull: true, field: 'from_store_id' },
    toStoreId: { type: DataTypes.UUID, allowNull: false, field: 'to_store_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'unit_price' },
    totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, field: 'total_amount' },
    salesPersonId: { type: DataTypes.UUID, allowNull: true, field: 'sales_person_id' },
    status: {
      type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    referenceInvoice: { type: DataTypes.STRING, allowNull: true, field: 'reference_invoice' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...auditFields,
  },
  {
    ...auditOptions,
    tableName: 'inventory_transfers',
    indexes: [
      { fields: ['tenant_id', 'to_store_id'] },
      { fields: ['tenant_id', 'sales_person_id'] }
    ],
  }
);

module.exports = InventoryTransfer;
