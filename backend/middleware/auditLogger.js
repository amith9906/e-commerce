'use strict';
const { AuditLog } = require('../models');
const { hasFeature } = require('../config/plans');

/**
 * Audit logging middleware.
 * Logs mutating requests (POST/PUT/PATCH/DELETE) for tenants on plans that include audit logs.
 * Always logs for superadmin actions regardless of plan.
 *
 * Attach AFTER authenticate + resolveTenant middleware.
 */
const auditLogger = (action, entity) => (req, res, next) => {
  // Only log for authenticated users
  if (!req.user) return next();

  const isSuperAdmin = req.user.role === 'superadmin';
  const plan = req.tenant?.plan || 'free';

  // Log if superadmin OR tenant plan has auditLogs feature
  if (!isSuperAdmin && !hasFeature(plan, 'auditLogs')) return next();

  // Capture response status by overriding res.json
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Fire-and-forget audit log (don't block response)
    setImmediate(() => {
      const sanitizedBody = sanitizeBody(req.body);
      AuditLog.create({
        tenantId: req.tenant?.id || null,
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        userRole: req.user?.role || null,
        action: action || buildAction(req),
        entity: entity || null,
        entityId: req.params?.id || null,
        method: req.method,
        path: req.path,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        requestBody: sanitizedBody,
        responseStatus: res.statusCode,
        metadata: {},
      }).catch(() => {}); // silent fail — never block the response
    });

    return originalJson(body);
  };

  next();
};

const buildAction = (req) => {
  const method = req.method.toLowerCase();
  const path = req.path.replace(/\/[0-9a-f-]{36}/gi, '/:id'); // anonymize UUIDs
  return `${method}:${path}`;
};

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'otp', 'token', 'secret', 'stripeKey', 'accessKey']);

const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  const result = {};
  for (const [k, v] of Object.entries(body)) {
    result[k] = SENSITIVE_KEYS.has(k) ? '[REDACTED]' : v;
  }
  return result;
};

module.exports = auditLogger;
