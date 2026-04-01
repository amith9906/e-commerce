'use strict';
const crypto = require('crypto');
const { Op, Sequelize } = require('sequelize');
const { CartItem, CartRecoveryToken, Tenant, User, Product } = require('../models');
const { sendEmail } = require('../utils/mailer');
const { renderInvoiceContent, formatCurrencyWithTenant } = require('../utils/invoiceTemplate');

const THRESHOLD_MINUTES_DEFAULT = Number(process.env.CART_RECOVERY_THRESHOLD_MINUTES || '120');
const EXPIRATION_HOURS_DEFAULT = Number(process.env.CART_RECOVERY_EXPIRATION_HOURS || '48');
const FRONTEND_BASE_URL_DEFAULT = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

const DEFAULT_TEMPLATE = `Hi {{customerName}},

Looks like you left {{tenantName}} with items still in your cart:

{{cartSummary}}

Total: {{totalAmount}}

Pick up where you left off: {{recoverLink}}

Need help? Reach out at {{supportEmail}}.
`;

const buildCartSummary = (items = [], currency) =>
  items
    .map((item) => {
      const prod = item.product || {};
      const name = prod.name || 'Product';
      const qty = item.quantity || 0;
      const price = prod.price || 0;
      return `- ${name} × ${qty} (${formatCurrencyWithTenant(price, currency)})`;
    })
    .join('\n');

const buildContext = ({ tenant, user, total, link, items }) => {
  const currency = tenant?.settings?.currency || 'INR';
  const supportEmail = tenant?.settings?.supportContacts?.email || 'support@example.com';
  return {
    tenantName: tenant?.name || 'Our Store',
    customerName: user?.name || user?.email || 'Valued Customer',
    totalAmount: formatCurrencyWithTenant(total, currency),
    cartSummary: buildCartSummary(items, currency) || 'Cart data unavailable.',
    recoverLink: link,
    supportEmail,
  };
};

const getTemplateBody = (tenant) => (tenant?.settings?.cartRecoveryTemplate || DEFAULT_TEMPLATE).trim() || DEFAULT_TEMPLATE;

const sendRecoveryEmail = async ({ tenant, user, items, token, total, frontendBaseUrl }) => {
  const link = `${frontendBaseUrl}/cart?recoverToken=${token}`;
  const context = buildContext({ tenant, user, total, link, items });
  const body = renderInvoiceContent(getTemplateBody(tenant), context);
  const htmlBody = `<div style="font-family:system-ui, sans-serif;line-height:1.4;">${body
    .split('\n')
    .map((line) => `<p style="margin:0 0 0.35rem;">${line || '&nbsp;'}</p>`)
    .join('')}</div>`;
  const subject = `${tenant?.name || 'Store'} • Your cart is waiting for you`;
  return sendEmail(user.email, subject, body, htmlBody);
};

const expireTokens = async (tenantId) => {
  const where = {
    status: 'sent',
    expiresAt: { [Op.lt]: new Date() }
  };
  if (tenantId) where.tenantId = tenantId;
  await CartRecoveryToken.update({ status: 'expired' }, { where });
};

const runCartRecovery = async (options = {}) => {
  const thresholdMinutes = Number(options.thresholdMinutes ?? THRESHOLD_MINUTES_DEFAULT);
  const expirationHours = Number(options.expirationHours ?? EXPIRATION_HOURS_DEFAULT);
  const frontendBaseUrl = options.frontendBaseUrl || FRONTEND_BASE_URL_DEFAULT;
  const tenantId = options.tenantId || null;
  const summary = { processed: 0, sent: 0, skipped: 0, errors: [] };

  await expireTokens(tenantId);

  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);
  const cutoffCondition = Sequelize.where(Sequelize.col('updated_at'), { [Op.lt]: cutoff });
  const whereClause = {
    ...(tenantId ? { tenantId } : {}),
    [Op.and]: [cutoffCondition]
  };

  const staleUsers = await CartItem.findAll({
    where: whereClause,
    attributes: [
      'tenantId',
      'userId',
      [Sequelize.fn('MAX', Sequelize.col('updated_at')), 'lastUpdated']
    ],
    group: ['tenantId', 'userId']
  });

  for (const record of staleUsers) {
    summary.processed += 1;
    const tenantIdFromRecord = record.get('tenantId');
    const userId = record.get('userId');
    if (!tenantIdFromRecord || !userId) {
      summary.skipped += 1;
      continue;
    }

    try {
      const existing = await CartRecoveryToken.findOne({
        where: {
          tenantId: tenantIdFromRecord,
          userId,
          status: 'sent',
          expiresAt: { [Op.gt]: new Date() }
        }
      });
      if (existing) {
        summary.skipped += 1;
        continue;
      }

      const user = await User.findOne({ where: { id: userId, tenantId: tenantIdFromRecord }, attributes: ['id', 'email', 'name'] });
      if (!user?.email) {
        summary.skipped += 1;
        continue;
      }

      const items = await CartItem.findAll({
        where: { tenantId: tenantIdFromRecord, userId },
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price'] }]
      });
      if (!items.length) {
        summary.skipped += 1;
        continue;
      }

      const total = items.reduce((sum, item) => sum + (Number(item.product?.price) || 0) * (item.quantity || 1), 0);
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

      await CartRecoveryToken.create({
        tenantId: tenantIdFromRecord,
        userId,
        token,
        expiresAt,
        status: 'sent',
        createdBy: userId,
        updatedBy: userId
      });

      const tenant = await Tenant.findByPk(tenantIdFromRecord);
      await sendRecoveryEmail({ tenant, user, items, token, total, frontendBaseUrl });
      summary.sent += 1;
    } catch (error) {
      summary.errors.push(error.message || 'Cart recovery job error');
      summary.skipped += 1;
    }
  }

  return summary;
};

module.exports = { runCartRecovery };
