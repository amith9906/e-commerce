'use strict';
const { getLimit } = require('../config/plans');

/**
 * Per-tenant API rate limiting using an in-memory store.
 * In production, replace with a Redis-backed store for distributed deployments.
 *
 * Each tenant gets a sliding window based on their plan's apiCallsPerMinute limit.
 */
const tenantWindows = new Map(); // tenantId -> { count, windowStart }

const WINDOW_MS = 60 * 1000; // 1 minute

const tenantRateLimit = (req, res, next) => {
  // Only apply when tenant is resolved
  if (!req.tenant) return next();

  const tenantId = req.tenant.id;
  const plan = req.tenant.plan || 'free';
  const limit = getLimit(plan, 'apiCallsPerMinute');

  const now = Date.now();
  const window = tenantWindows.get(tenantId);

  if (!window || now - window.windowStart > WINDOW_MS) {
    tenantWindows.set(tenantId, { count: 1, windowStart: now });
    return next();
  }

  window.count += 1;

  if (window.count > limit) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - window.windowStart)) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      code: 'TENANT_RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded for your plan (${plan}): ${limit} requests/minute. Retry after ${retryAfter}s.`,
      limit,
      retryAfter,
    });
  }

  next();
};

// Periodically clean up old windows to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [id, window] of tenantWindows) {
    if (now - window.windowStart > WINDOW_MS * 2) {
      tenantWindows.delete(id);
    }
  }
}, WINDOW_MS * 5);

module.exports = tenantRateLimit;
