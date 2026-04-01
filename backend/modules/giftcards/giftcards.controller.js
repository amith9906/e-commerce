'use strict';
const { GiftCard, GiftCardRedemption, Order, User } = require('../../models');
const { Op } = require('sequelize');
const { formatCurrency } = require('../../utils/currency');
const { sendEmail } = require('../../utils/mailer');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.status = 400;
  }
}

const formatLocaleDate = (value) => (value ? new Date(value).toLocaleDateString() : 'No expiry');

const buildGiftCardEmailContent = ({ giftCard, tenant, note = '' }) => {
  const currency = tenant?.settings?.currency || 'INR';
  const storeName = tenant?.name || 'Our store';
  const formattedValue = formatCurrency(giftCard.value, currency);
  const expiryText = giftCard.expiresAt ? formatLocaleDate(giftCard.expiresAt) : 'No expiry';
  const textLines = [
    `${storeName} has gifted you a ${formattedValue} store credit.`,
    `Code: ${giftCard.code}`,
    `Expires: ${expiryText}`,
    note ? `Message: ${note}` : '',
    'Apply the code at checkout to redeem the balance.'
  ].filter(Boolean);

  const htmlParts = [
    `<p>${storeName} has gifted you a <strong>${formattedValue}</strong> store credit.</p>`,
    `<p><strong>Code:</strong> ${giftCard.code}</p>`,
    `<p><strong>Expires:</strong> ${expiryText}</p>`
  ];
  if (note) htmlParts.push(`<p>${note}</p>`);
  htmlParts.push('<p>Apply the code at checkout to redeem the balance.</p>');

  return {
    subject: `${storeName} Gift Card`,
    text: textLines.join('\n'),
    html: htmlParts.join('')
  };
};

const logGiftCardNotification = async ({ giftCard, email, status, note, userId }) => {
  const metadata = giftCard.metadata && typeof giftCard.metadata === 'object' ? { ...giftCard.metadata } : {};
  const notifications = Array.isArray(metadata.notifications) ? [...metadata.notifications] : [];
  const entry = {
    email,
    status,
    note: note || '',
    sentAt: new Date().toISOString()
  };
  metadata.notifications = [entry, ...notifications].slice(0, 5);
  metadata.recipientEmail = email;
  await giftCard.update({ metadata, updatedBy: userId }, { silent: true });
  return entry;
};

const notifyGiftCardRecipient = async ({ giftCard, tenant, userId, recipientEmail, note }) => {
  const normalizedEmail = (recipientEmail || '').toString().trim().toLowerCase();
  if (!normalizedEmail) {
    throw new BadRequestError('Recipient email is required to send notifications.');
  }

  const emailContent = buildGiftCardEmailContent({ giftCard, tenant, note });
  const sent = await sendEmail(normalizedEmail, emailContent.subject, emailContent.text, emailContent.html);
  const entry = await logGiftCardNotification({
    giftCard,
    email: normalizedEmail,
    status: sent ? 'sent' : 'failed',
    note,
    userId
  });

  return {
    success: sent,
    entry
  };
};

const normalizeCode = (code = '') => (code || '').toString().trim().toUpperCase();

const listGiftCards = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);
    const { q, status } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;
    if (q) where.code = { [Op.iLike]: `%${q}%` };

    const { count, rows } = await GiftCard.findAndCountAll({
      where,
      include: [
        {
          model: GiftCardRedemption,
          as: 'redemptions',
          attributes: ['id', 'amount', 'created_at'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ],
          limit: 3,
          order: [['created_at', 'DESC']],
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      subQuery: false
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

const createGiftCard = async (req, res, next) => {
  try {
    const {
      code,
      value,
      initialBalance,
      expiresAt,
      isActive = true,
      metadata = {},
      recipientEmail,
      message,
      sendNotification = false
    } = req.body;

    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      throw new BadRequestError('Gift card code is required.');
    }
    const numericValue = Number(value);
    if (!numericValue || numericValue <= 0) {
      throw new BadRequestError('Gift card value must be greater than zero.');
    }
    let balanceValue = numericValue;
    if (initialBalance !== undefined && initialBalance !== null) {
      const parsedInitial = Number(initialBalance);
      if (!Number.isNaN(parsedInitial) && parsedInitial >= 0) {
        balanceValue = Math.min(parsedInitial, numericValue);
      }
    }

    const parsedMetadata = metadata && typeof metadata === 'object' ? { ...metadata } : {};
    const normalizedRecipientEmail = (recipientEmail || '').toString().trim().toLowerCase();
    if (normalizedRecipientEmail) {
      parsedMetadata.recipientEmail = normalizedRecipientEmail;
    }

    const giftCard = await GiftCard.create({
      tenantId: req.tenant.id,
      code: normalizedCode,
      value: numericValue,
      balance: Math.min(balanceValue, numericValue),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: Boolean(isActive),
      metadata: parsedMetadata,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    const shouldNotifyRecipient = Boolean(
      normalizedRecipientEmail
      && (
        sendNotification === true
        || sendNotification === 'true'
        || sendNotification === '1'
      )
    );

    if (shouldNotifyRecipient) {
      await notifyGiftCardRecipient({
        giftCard,
        tenant: req.tenant,
        userId: req.user.id,
        recipientEmail: normalizedRecipientEmail,
        note: message || parsedMetadata.note || ''
      });
      await giftCard.reload();
    }

    res.status(201).json({ success: true, data: giftCard });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return next(new BadRequestError('Gift card code already exists.'));
    }
    if (err.status === 400) {
      return next(err);
    }
    next(err);
  }
};

const sendGiftCardEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipientEmail, message } = req.body;
    const normalizedEmail = (recipientEmail || '').toString().trim().toLowerCase();

    const giftCard = await GiftCard.findOne({
      where: { id, tenantId: req.tenant.id }
    });
    if (!giftCard) {
      throw new BadRequestError('Gift card not found.');
    }

    if (!normalizedEmail) {
      throw new BadRequestError('Recipient email is required.');
    }

    const result = await notifyGiftCardRecipient({
      giftCard,
      tenant: req.tenant,
      userId: req.user.id,
      recipientEmail: normalizedEmail,
      note: message || giftCard.metadata?.note || ''
    });

    await giftCard.reload();

    res.json({
      success: true,
      data: {
        entry: result.entry,
        success: result.success
      }
    });
  } catch (err) {
    if (err.status === 400) return next(err);
    next(err);
  }
};

const updateGiftCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, balance, expiresAt, metadata, value } = req.body;
    const giftCard = await GiftCard.findOne({
      where: { id, tenantId: req.tenant.id }
    });
    if (!giftCard) {
      throw new BadRequestError('Gift card not found.');
    }

    const updates = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (balance !== undefined && balance !== null) {
      const parsedBalance = Number(balance);
      if (!Number.isNaN(parsedBalance)) {
        updates.balance = Math.max(0, parsedBalance);
      }
    }
    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (value !== undefined && value !== null) {
      const parsedValue = Number(value);
      if (!Number.isNaN(parsedValue) && parsedValue > 0) {
        updates.value = parsedValue;
      }
    }
    if (metadata && typeof metadata === 'object') {
      updates.metadata = metadata;
    }
    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No valid fields supplied for update.');
    }

    await giftCard.update({
      ...updates,
      updatedBy: req.user.id
    });

    res.json({ success: true, data: giftCard });
  } catch (err) {
    if (err.status === 400) return next(err);
    next(err);
  }
};

const validateGiftCard = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw new BadRequestError('Gift card code is required.');
    }
    const normalizedCode = normalizeCode(code);
    const giftCard = await GiftCard.findOne({
      where: {
        tenantId: req.tenant.id,
        code: normalizedCode,
        isActive: true
      }
    });
    if (!giftCard) {
      throw new BadRequestError('Gift card not found or inactive.');
    }
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      throw new BadRequestError('Gift card has expired.');
    }
    const balance = Number(giftCard.balance);
    if (balance <= 0) {
      throw new BadRequestError('Gift card has no remaining balance.');
    }

    res.json({
      success: true,
      data: {
        code: giftCard.code,
        value: Number(giftCard.value),
        balance,
        expiresAt: giftCard.expiresAt,
        currency: req.tenant?.settings?.currency || 'INR',
        isActive: giftCard.isActive
      }
    });
  } catch (err) {
    if (err.status === 400) return next(err);
    next(err);
  }
};

const listGiftCardRedemptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, export: exportFormat } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = { tenantId: req.tenant.id };
    const { count, rows } = await GiftCardRedemption.findAndCountAll({
      where,
    include: [
      { model: GiftCard, as: 'giftCard', attributes: ['code'] },
      { model: Order, as: 'order', attributes: ['id', 'totalAmount'] },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
    ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    if (exportFormat === 'csv') {
      const currency = req.tenant?.settings?.currency || 'INR';
      const headers = ['Code', 'Order ID', 'Amount', 'Timestamp'];
      const rowsCsv = rows.map((row) => [
        row.giftCard?.code || 'N/A',
        row.orderId,
        formatCurrency ? formatCurrency(row.amount, currency) : row.amount,
        new Date(row.createdAt).toISOString()
      ]);
      const csv = [headers, ...rowsCsv].map((line) => line.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=gift-card-redemptions.csv');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: {
        total: count,
        redemptions: rows
      }
    });
  } catch (err) {
    next(err);
  }
};

const getGiftCardSummary = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const [totalCount, activeCount, totalBalance, totalRedeemed] = await Promise.all([
      GiftCard.count({ where: { tenantId } }),
      GiftCard.count({ where: { tenantId, isActive: true } }),
      GiftCard.sum('balance', { where: { tenantId } }),
      GiftCardRedemption.sum('amount', { where: { tenantId } })
    ]);

    res.json({
      success: true,
      data: {
        totalCount,
        activeCount,
        totalBalance: Number(totalBalance || 0),
        totalRedeemed: Number(totalRedeemed || 0)
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listGiftCards,
  createGiftCard,
  sendGiftCardEmail,
  updateGiftCard,
  validateGiftCard,
  listGiftCardRedemptions,
  getGiftCardSummary,
  BadRequestError
};
