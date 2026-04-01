'use strict';
const crypto = require('crypto');
const { Op } = require('sequelize');
const { TenantWebhook } = require('../../models');
const { emitEvent } = require('../../utils/webhookDispatcher');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const listWebhooks = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);
    const { q, status } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { url: { [Op.iLike]: `%${q}%` } }
      ];
    }
    const { count, rows } = await TenantWebhook.findAndCountAll({
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

const getWebhook = async (req, res, next) => {
  try {
    const webhook = await TenantWebhook.findOne({
      where: { id: req.params.webhookId, tenantId: req.tenant.id }
    });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found.' });
    res.json({ success: true, data: webhook });
  } catch (err) {
    next(err);
  }
};

const createWebhook = async (req, res, next) => {
  try {
    const { name, url, events = [], secret, status } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'Name and URL are required.' });
    }
    if (!Array.isArray(events) || !events.length) {
      return res.status(400).json({ success: false, message: 'Provide at least one event name.' });
    }

    const webhook = await TenantWebhook.create({
      tenantId: req.tenant.id,
      name,
      url,
      events,
      secret: secret || crypto.randomBytes(16).toString('hex'),
      status: status === 'disabled' ? 'disabled' : 'enabled',
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: webhook });
  } catch (err) {
    next(err);
  }
};

const updateWebhook = async (req, res, next) => {
  try {
    const webhook = await TenantWebhook.findOne({
      where: { id: req.params.webhookId, tenantId: req.tenant.id }
    });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found.' });

    const updates = {};
    ['name', 'url', 'status'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (Array.isArray(req.body.events)) updates.events = req.body.events;
    if (req.body.secret) updates.secret = req.body.secret;
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'No updates provided.' });

    updates.updatedBy = req.user.id;
    await webhook.update(updates);
    res.json({ success: true, data: webhook });
  } catch (err) {
    next(err);
  }
};

const deleteWebhook = async (req, res, next) => {
  try {
    const deleted = await TenantWebhook.destroy({
      where: { id: req.params.webhookId, tenantId: req.tenant.id }
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Webhook not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const testWebhook = async (req, res, next) => {
  try {
    const webhook = await TenantWebhook.findOne({
      where: { id: req.params.webhookId, tenantId: req.tenant.id }
    });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found.' });
    await emitEvent(req.tenant.id, 'test.ping', { test: true, webhookId: webhook.id });
    res.json({ success: true, message: 'Test event queued.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
};
