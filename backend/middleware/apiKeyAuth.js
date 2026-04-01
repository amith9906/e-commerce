'use strict';
const bcrypt = require('bcryptjs');
const { TenantApiKey, Tenant } = require('../models');

const apiKeyAuth = async (req, res, next) => {
  const header = (req.headers['x-api-key'] || '').trim();
  if (!header) return next();
  const [keyId, secret] = header.split(':');
  if (!keyId || !secret) {
    return res.status(401).json({ success: false, message: 'Provide API key as keyId:secret.' });
  }
  try {
    const apiKey = await TenantApiKey.findOne({ where: { keyId, status: 'active' } });
    if (!apiKey) return res.status(401).json({ success: false, message: 'Invalid API key.' });
    const match = await bcrypt.compare(secret, apiKey.secretHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid API secret.' });
    const tenant = await Tenant.findOne({ where: { id: apiKey.tenantId } });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });
    await apiKey.update({ lastUsedAt: new Date() });
    req.tenant = tenant;
    req.apiKey = apiKey;
    req.user = { id: apiKey.createdBy, role: 'apiKey' };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = apiKeyAuth;
