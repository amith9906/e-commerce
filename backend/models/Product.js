'use strict';
const { DataTypes } = require('sequelize');
const slugify = require('slugify');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    salePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'sale_price' },
    offerLabel: { type: DataTypes.STRING, allowNull: true, field: 'offer_label' },
    offerExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'offer_expires_at' },
    isBestSeller: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_best_seller' },
    category: { type: DataTypes.STRING },
    brand: { type: DataTypes.STRING },
    color: { type: DataTypes.STRING },
    size: { type: DataTypes.STRING },
    sku: { type: DataTypes.STRING },
    images: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    specifications: { type: DataTypes.JSONB, defaultValue: {} },
    highlights: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    ratingAvg: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0, field: 'rating_avg' },
    ratingCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'rating_count' },
    availableSizes: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        if (value && typeof value === 'string') {
          this.setDataValue('slug', slugify(value, { lower: true, strict: true }));
        } else if (!this.getDataValue('slug') && this.getDataValue('name')) {
          this.setDataValue('slug', slugify(this.getDataValue('name'), { lower: true, strict: true }));
        }
      }
    },
    availableColors: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    ...auditFields,
  },
  {
    ...auditOptions,
    tableName: 'products',
    indexes: [
      { fields: ['tenant_id', 'slug'], unique: true, name: 'products_tenant_slug_idx' }
    ]
  }
);

Product.beforeValidate((product) => {
  if (!product.slug && product.name) {
    product.slug = slugify(product.name, { lower: true, strict: true });
  }
});

module.exports = Product;
