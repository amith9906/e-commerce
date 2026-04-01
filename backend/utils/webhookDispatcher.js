'use strict';
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { TenantWebhook, WebhookDelivery } = require('../models');

const createSignature = (secret, payload) => {
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

const sendRequest = (webhook, event, payload) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ event, payload, emittedAt: new Date().toISOString() });
    const url = new URL(webhook.url);
    const isSecure = url.protocol === 'https:';
    const transport = isSecure ? https : http;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'X-Webhook-Event': event,
    };

    const signature = createSignature(webhook.secret, body);
    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    const req = transport.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (isSecure ? 443 : 80),
        path: url.pathname + url.search,
        headers,
        timeout: 10000,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk.toString();
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: responseBody });
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Webhook request timed out.'));
    });

    req.write(body);
    req.end();
  });
};

const recordDelivery = async (webhook, event, payload, result, success) => {
  await WebhookDelivery.create({
    tenantWebhookId: webhook.id,
    event,
    payload,
    status: success ? 'success' : 'failure',
    responseCode: result?.statusCode || null,
    responseBody: result?.body || (result?.message || null),
  });
  await webhook.update({
    lastStatus: success ? 'success' : 'failure',
    lastAttemptedAt: new Date(),
  });
};

const dispatchWebhook = async (webhook, event, payload) => {
  try {
    const result = await sendRequest(webhook, event, payload);
    await recordDelivery(webhook, event, payload, result, result.statusCode >= 200 && result.statusCode < 300);
  } catch (err) {
    await recordDelivery(webhook, event, payload, { message: err.message }, false);
  }
};

const emitEvent = async (tenantId, event, payload = {}) => {
  const webhooks = await TenantWebhook.findAll({
    where: { tenantId, status: 'enabled', events: { [Op.contains]: [event] } }
  });
  for (const webhook of webhooks) {
    await dispatchWebhook(webhook, event, payload);
  }
};

module.exports = { emitEvent };
