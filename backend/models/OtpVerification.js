'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const OtpVerification = sequelize.define(
  'OtpVerification',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    otpCode: { type: DataTypes.STRING(6), allowNull: false, field: 'otp_code' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'otp_verifications' }
);

module.exports = OtpVerification;
