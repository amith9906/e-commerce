'use strict';

/**
 * Stripe Service - wraps Stripe SDK calls.
 * Falls back to mock mode when STRIPE_SECRET_KEY is not configured.
 */

let stripe = null;

const initStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } catch {
      console.warn('[Stripe] stripe package not installed. Running in mock mode.');
    }
  }
  return stripe;
};

const isMockMode = () => !process.env.STRIPE_SECRET_KEY || !initStripe();

// Create or retrieve a Stripe customer for a tenant
const getOrCreateCustomer = async ({ tenantId, tenantName, email }) => {
  if (isMockMode()) {
    return { id: `mock_cus_${tenantId.replace(/-/g, '')}` };
  }
  const s = initStripe();
  const existing = await s.customers.list({ metadata: { tenantId }, limit: 1 });
  if (existing.data.length) return existing.data[0];
  return s.customers.create({ name: tenantName, email, metadata: { tenantId } });
};

// Create a Stripe checkout session for a subscription
const createCheckoutSession = async ({ customerId, priceId, successUrl, cancelUrl, metadata }) => {
  if (isMockMode()) {
    return {
      id: `mock_cs_${Date.now()}`,
      url: `${successUrl}?mock=1&session_id=mock_cs_${Date.now()}`,
    };
  }
  const s = initStripe();
  return s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
};

// Create a Stripe customer portal session for managing billing
const createPortalSession = async ({ customerId, returnUrl }) => {
  if (isMockMode()) {
    return { url: returnUrl };
  }
  const s = initStripe();
  return s.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
};

// Cancel a Stripe subscription
const cancelSubscription = async (stripeSubscriptionId) => {
  if (isMockMode()) return { id: stripeSubscriptionId, status: 'cancelled' };
  const s = initStripe();
  return s.subscriptions.cancel(stripeSubscriptionId);
};

// Construct a webhook event from raw body
const constructWebhookEvent = (rawBody, signature, secret) => {
  if (isMockMode()) throw new Error('Stripe not configured');
  const s = initStripe();
  return s.webhooks.constructEvent(rawBody, signature, secret);
};

// Map Stripe price IDs to plan names (configure in env)
const STRIPE_PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_STARTER]: 'starter',
  [process.env.STRIPE_PRICE_GROWTH]: 'growth',
  [process.env.STRIPE_PRICE_ENTERPRISE]: 'enterprise',
};

const PLAN_TO_STRIPE_PRICE = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

const getPlanFromPriceId = (priceId) => STRIPE_PRICE_TO_PLAN[priceId] || 'free';
const getPriceIdForPlan = (plan) => PLAN_TO_STRIPE_PRICE[plan] || null;

module.exports = {
  isMockMode,
  getOrCreateCustomer,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  constructWebhookEvent,
  getPlanFromPriceId,
  getPriceIdForPlan,
};
