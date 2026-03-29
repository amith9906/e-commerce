'use strict';
const { DataTypes } = require('sequelize');

/**
 * Shared audit columns injected into every model definition.
 * Usage: spread into the fields object of any model.
 */
const auditFields = {
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
};

/**
 * Shared Sequelize model options (timestamps, underscored).
 * Sequelize automatically manages createdAt / updatedAt.
 */
const auditOptions = {
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

module.exports = { auditFields, auditOptions };
