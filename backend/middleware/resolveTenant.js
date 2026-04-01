'use strict';
const { Op } = require('sequelize');
const { Tenant } = require('../models');

/**
 * Resolves tenant from:
 * 1. X-Tenant-Slug header (dev / API clients)
 * 2. Custom domain (e.g. shop.mybrand.com)
 * 3. Subdomain of the SaaS domain (e.g. acme.yoursaas.com)
 *
 * Attaches req.tenant to the request.
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenant = null;

    // 1. Explicit header (useful in dev / non-subdomain environments)
    if (req.headers['x-tenant-slug']) {
      const slug = req.headers['x-tenant-slug'];
      tenant = await Tenant.findOne({ where: { slug } });
    }

    if (!tenant && req.query?.tenantSlug) {
      tenant = await Tenant.findOne({ where: { slug: req.query.tenantSlug } });
    }

    // 2. Try custom domain match
    if (!tenant) {
      const host = (req.headers.host || '').split(':')[0]; // strip port
      const saasDomain = process.env.SAAS_DOMAIN || '';

      // Check if host is a custom domain (not a subdomain of SaaS domain)
      const isSubdomainOfSaas = saasDomain && host.endsWith(`.${saasDomain}`);
      if (!isSubdomainOfSaas && host && host !== saasDomain) {
        tenant = await Tenant.findOne({ where: { customDomain: host } });
      }

      // 3. Subdomain-based resolution: tenant.yoursaas.com
      if (!tenant && isSubdomainOfSaas) {
        const slug = host.replace(`.${saasDomain}`, '');
        if (slug) {
          tenant = await Tenant.findOne({ where: { slug } });
        }
      }
    }

    if (!tenant) {
      return res.status(400).json({ success: false, message: 'Tenant could not be resolved.' });
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
