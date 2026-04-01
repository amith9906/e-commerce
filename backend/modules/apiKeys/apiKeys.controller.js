'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { TenantApiKey } = require('../../models');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');
const { getLimit, getPlan } = require('../../config/plans');

const listApiKeys = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);
    const { q, status } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;
    if (q) {
      where.label = { [Op.iLike]: `%${q}%` };
    }
    const { count, rows } = await TenantApiKey.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    res.json({
      success: true,
      data: rows,
      pagination: buildPaginationMeta(count, { page, limit })
    });
  } catch (err) {
    next(err);
  }
};

const createApiKey = async (req, res, next) => {
  try {
    const { label, expiresAt } = req.body;
    if (!label) {
      return res.status(400).json({ success: false, message: 'Label is required.' });
    }
    const plan = req.tenant?.plan || 'free';
    const limit = getLimit(plan, 'apiKeys');
    if (limit !== Infinity) {
      const currentCount = await TenantApiKey.count({ where: { tenantId: req.tenant.id } });
      if (currentCount >= limit) {
        return res.status(402).json({ success: false, message: 'API key limit reached. Upgrade your plan.', currentCount, limit });
      }
    }

    const keyId = crypto.randomBytes(6).toString('hex');
    const secret = crypto.randomBytes(18).toString('hex');
    const secretHash = await bcrypt.hash(secret, 10);
    const apiKey = await TenantApiKey.create({
      tenantId: req.tenant.id,
      label,
      keyId,
      secretHash,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: { ...apiKey.toJSON(), secret } });
  } catch (err) {
    next(err);
  }
};

const revokeApiKey = async (req, res, next) => {
  try {
    const apiKey = await TenantApiKey.findOne({
      where: { keyId: req.params.keyId, tenantId: req.tenant.id }
    });
    if (!apiKey) return res.status(404).json({ success: false, message: 'API key not found.' });
    await apiKey.update({ status: 'revoked', updatedBy: req.user.id });
    res.json({ success: true, data: apiKey });
  } catch (err) {
    next(err);
  }
};

const regenerateApiKey = async (req, res, next) => {
  try {
    const apiKey = await TenantApiKey.findOne({
      where: { keyId: req.params.keyId, tenantId: req.tenant.id }
    });
    if (!apiKey) return res.status(404).json({ success: false, message: 'API key not found.' });
    const newSecret = crypto.randomBytes(18).toString('hex');
    const secretHash = await bcrypt.hash(newSecret, 10);
    await apiKey.update({ secretHash, updatedBy: req.user.id, status: 'active' });
    res.json({ success: true, data: { ...apiKey.toJSON(), secret: newSecret } });
  } catch (err) {
    next(err);
  }
};

module.exports = { listApiKeys, createApiKey, revokeApiKey, regenerateApiKey };
