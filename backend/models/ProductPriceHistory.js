'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductPriceHistory = sequelize.define(
  'ProductPriceHistory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id'
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'sale_price'
    },
    offerLabel: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'offer_label'
    },
    effectiveAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'effective_at'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'updated_by'
    }
  },
  {
    tableName: 'product_price_histories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = ProductPriceHistory;
