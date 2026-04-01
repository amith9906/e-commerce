'use strict';
const { SSOSetting } = require('../../models');

const listSettings = async (req, res, next) => {
  try {
    const settings = await SSOSetting.findAll({ where: { tenantId: req.tenant.id } });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

const upsertSetting = async (req, res, next) => {
  try {
    const { provider, enabled, clientId, clientSecret, redirectUri, scopes, metadata } = req.body;
    if (!provider || !clientId || !clientSecret) {
      return res.status(400).json({ success: false, message: 'provider, clientId, and clientSecret are required.' });
    }
    const [setting] = await SSOSetting.findOrCreate({
      where: { tenantId: req.tenant.id, provider },
      defaults: {
        tenantId: req.tenant.id,
        provider,
        enabled: Boolean(enabled),
        clientId,
        clientSecret,
        redirectUri,
        scopes,
        metadata: metadata || {},
        createdBy: req.user.id,
        updatedBy: req.user.id,
      }
    });
    if (setting.updatedAt && setting.createdAt && setting.clientId !== clientId) {
      // updated via defaults? not necessary
    }
    await setting.update({
      enabled: typeof enabled === 'boolean' ? enabled : setting.enabled,
      clientId,
      clientSecret,
      redirectUri,
      scopes,
      metadata: metadata || setting.metadata,
      updatedBy: req.user.id,
    });
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

const deleteSetting = async (req, res, next) => {
  try {
    const deleted = await SSOSetting.destroy({
      where: { tenantId: req.tenant.id, provider: req.params.provider }
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Setting not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { listSettings, upsertSetting, deleteSetting };
