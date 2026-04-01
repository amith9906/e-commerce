'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { auditFields, auditOptions } = require('./baseModel');

const Subscription = sequelize.define(
  'Subscription',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    plan: { type: DataTypes.STRING, allowNull: false, defaultValue: 'free' },
    status: {
      type: DataTypes.ENUM('trialing', 'active', 'past_due', 'cancelled', 'expired'),
      defaultValue: 'active',
    },
    billingCycle: { type: DataTypes.ENUM('monthly', 'yearly'), allowNull: true, field: 'billing_cycle' },
    currentPeriodStart: { type: DataTypes.DATE, allowNull: true, field: 'current_period_start' },
    currentPeriodEnd: { type: DataTypes.DATE, allowNull: true, field: 'current_period_end' },
    trialEndsAt: { type: DataTypes.DATE, allowNull: true, field: 'trial_ends_at' },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, field: 'cancelled_at' },
    stripeCustomerId: { type: DataTypes.STRING, allowNull: true, field: 'stripe_customer_id' },
    stripeSubscriptionId: { type: DataTypes.STRING, allowNull: true, field: 'stripe_subscription_id' },
    stripePriceId: { type: DataTypes.STRING, allowNull: true, field: 'stripe_price_id' },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    ...auditFields,
  },
  { ...auditOptions, tableName: 'subscriptions' }
);

module.exports = Subscription;
