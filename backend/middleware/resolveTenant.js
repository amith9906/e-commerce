'use strict';
const { Tenant } = require('../models');

/**
 * Resolves tenant from the X-Tenant-Slug header (dev) or subdomain (prod).
 * Attaches req.tenant to the request.
 */
const resolveTenant = async (req, res, next) => {
  try {
    let slug;

    // Prefer explicit header (useful in dev / non-subdomain environments)
    if (req.headers['x-tenant-slug']) {
      slug = req.headers['x-tenant-slug'];
    } else {
      // Extract from subdomain: tenant1.yourdomain.com → tenant1
      const host = req.headers.host || '';
      const parts = host.split('.');
      if (parts.length >= 3) {
        slug = parts[0];
      }
    }

    if (!slug) {
      return res.status(400).json({ success: false, message: 'Tenant could not be resolved.' });
    }

    const tenant = await Tenant.findOne({ where: { slug } });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found.' });
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This store has been suspended.' });
    }

    if (tenant.status === 'deleted') {
      return res.status(410).json({ success: false, message: 'This store no longer exists.' });
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = resolveTenant;
