'use strict';

/**
 * Usage: requireRole('admin') or requireRole(['admin', 'superadmin'])
 */
const requireRole = (...roles) => {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!allowed.includes(req.user.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    next();
  };
};

module.exports = requireRole;
