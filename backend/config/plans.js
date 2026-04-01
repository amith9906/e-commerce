'use strict';

/**
 * SaaS Plan Definitions
 * Each plan defines feature limits and which features are accessible.
 * The `gate` key in middleware checks against these definitions.
 */
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    billingCycle: null,
    limits: {
      products: 10,
      stores: 1,
      users: 3,
      ordersPerMonth: 50,
      storageGb: 0.5,
      apiCallsPerMinute: 30,
      apiKeys: 1,
    },
    features: {
      analytics: false,
      customDomain: false,
      auditLogs: false,
      coupons: false,
      promotions: false,
      invoiceTemplates: false,
      commissions: false,
      multiStore: false,
      prioritySupport: false,
      dataExport: false,
      apiAccess: false,
      apiKeyManagement: false,
      outboundWebhooks: false,
      emailTemplates: false,
      sso: false,
    },
  },

  starter: {
    name: 'Starter',
    price: 29,
    billingCycle: 'monthly',
    limits: {
      products: 100,
      stores: 2,
      users: 10,
      ordersPerMonth: 500,
      storageGb: 5,
      apiCallsPerMinute: 60,
      apiKeys: 3,
    },
    features: {
      analytics: true,
      customDomain: false,
      auditLogs: false,
      coupons: true,
      promotions: true,
      invoiceTemplates: true,
      commissions: false,
      multiStore: false,
      prioritySupport: false,
      dataExport: true,
      apiAccess: false,
      apiKeyManagement: false,
      outboundWebhooks: false,
      emailTemplates: false,
      sso: false,
    },
  },

  growth: {
    name: 'Growth',
    price: 79,
    billingCycle: 'monthly',
    limits: {
      products: 1000,
      stores: 10,
      users: 50,
      ordersPerMonth: 5000,
      storageGb: 20,
      apiCallsPerMinute: 200,
      apiKeys: 10,
    },
    features: {
      analytics: true,
      customDomain: true,
      auditLogs: true,
      coupons: true,
      promotions: true,
      invoiceTemplates: true,
      commissions: true,
      multiStore: true,
      prioritySupport: false,
      dataExport: true,
      apiAccess: true,
      apiKeyManagement: true,
      outboundWebhooks: true,
      emailTemplates: true,
      sso: false,
    },
  },

  enterprise: {
    name: 'Enterprise',
    price: 249,
    billingCycle: 'monthly',
    limits: {
      products: Infinity,
      stores: Infinity,
      users: Infinity,
      ordersPerMonth: Infinity,
      storageGb: Infinity,
      apiCallsPerMinute: 1000,
      apiKeys: Infinity,
    },
    features: {
      analytics: true,
      customDomain: true,
      auditLogs: true,
      coupons: true,
      promotions: true,
      invoiceTemplates: true,
      commissions: true,
      multiStore: true,
      prioritySupport: true,
      dataExport: true,
      apiAccess: true,
      apiKeyManagement: true,
      outboundWebhooks: true,
      emailTemplates: true,
      sso: true,
    },
  },
};

const getPlan = (planKey) => PLANS[planKey] || PLANS.free;

const hasFeature = (planKey, feature) => {
  const plan = getPlan(planKey);
  return plan.features[feature] === true;
};

const getLimit = (planKey, limitKey) => {
  const plan = getPlan(planKey);
  return plan.limits[limitKey] ?? 0;
};

module.exports = { PLANS, getPlan, hasFeature, getLimit };
