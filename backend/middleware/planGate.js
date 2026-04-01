'use strict';
const { hasFeature, getLimit } = require('../config/plans');

/**
 * Middleware factory: gate a route behind a plan feature flag.
 * Usage: router.post('/coupons', planGate('coupons'), handler)
 */
const planGate = (feature) => (req, res, next) => {
  const plan = req.tenant?.plan || 'free';
  if (!hasFeature(plan, feature)) {
    return res.status(402).json({
      success: false,
      code: 'PLAN_UPGRADE_REQUIRED',
      message: `This feature (${feature}) is not available on your current plan (${plan}). Please upgrade.`,
      feature,
      currentPlan: plan,
    });
  }
  next();
};

/**
 * Middleware factory: gate a route behind a plan resource limit.
 * Dynamically checks current usage against the plan limit.
 * Usage: router.post('/products', planLimitCheck('products', getCurrentProductCount), handler)
 *
 * @param {string} limitKey - key in plan.limits (e.g. 'products')
 * @param {function} getCount - async (req) => number — returns current usage count
 */
const planLimitCheck = (limitKey, getCount) => async (req, res, next) => {
  try {
    const plan = req.tenant?.plan || 'free';
    const limit = getLimit(plan, limitKey);
    if (limit === Infinity) return next();

    const current = await getCount(req);
    if (current >= limit) {
      return res.status(402).json({
        success: false,
        code: 'PLAN_LIMIT_REACHED',
        message: `You have reached the ${limitKey} limit (${limit}) for your current plan (${plan}). Please upgrade.`,
        limitKey,
        limit,
        current,
        currentPlan: plan,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { planGate, planLimitCheck };
