'use strict';
const { Order, OrderItem, Stock, Product, Payment, UserAddress, Notification, User, Coupon, Promotion, OrderReturn, InvoiceTemplate, OrderInvoice, PricingRule, ProductReview, DeliveryRegion, DeliveryRestriction, GiftCard, GiftCardRedemption, LoyaltyPoint } = require('../../models');
const { uploadToS3 } = require('../../utils/s3Upload');
const { sendEmail } = require('../../utils/mailer');
const sequelize = require('../../config/database');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { renderInvoiceContent, defaultTemplate, buildInvoiceContext, formatCurrencyWithTenant, createInvoiceNumber } = require('../../utils/invoiceTemplate');
const { createInvoicePdfBuffer } = require('../../utils/pdfGenerator');
const { buildRestrictionMap, getRestrictionForProduct, findRegionForAddress } = require('../../utils/deliveryHelper');
const { determineShippingZone, calculateShippingFee } = require('../../utils/shippingHelper');
const { emitNotificationEvent } = require('../../utils/notificationEmitter');
const { calculateBalance, recordEntry } = require('../../utils/loyalty');
const { resolveTaxConfig } = require('../../utils/tax');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

const DEFAULT_STATUS_EMAIL_TEMPLATES = {
  placed: {
    subject: '{{tenantName}} - Order {{orderId}} Confirmed',
    body: `
Hi {{customerName}},

Your order {{orderId}} has been received and is now being processed. We’ll update you once it ships.

Order total: {{totalAmount}}
Shipping address: {{shippingAddress}}

Items:
{{itemsSummary}}

Need help? Reach us at {{supportEmail}} or {{supportPhone}}.
`
  },
  shipped: {
    subject: 'Your order {{orderId}} is on the way',
    body: `
Hi {{customerName}},

Great news! Your order {{orderId}} has shipped and is currently en route.

Shipping to: {{shippingAddress}}
Track your order: {{orderLink}}

Items:
{{itemsSummary}}

Need support? Reply to this email or contact {{supportEmail}}.
`
  },
  delivered: {
    subject: 'Order {{orderId}} delivered successfully',
    body: `
Hi {{customerName}},

We hope you enjoy your purchase! Order {{orderId}} has been delivered to {{shippingAddress}}.

If everything looks good, feel free to leave a review or reach us at {{supportEmail}}.

Thank you for shopping with {{tenantName}}!
`
  },
  delayed: {
    subject: 'Update for your order {{orderId}}',
    body: `
Hi {{customerName}},

We wanted to let you know that your order {{orderId}} has been delayed.

{{message}}

We are working to get it back on track. Contact {{supportEmail}} if you need anything.
`
  }
};

const formatShippingSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return 'Shipping details not available.';
  return [
    snapshot.addressLine1,
    snapshot.addressLine2,
    snapshot.city,
    snapshot.state,
    snapshot.postalCode,
    snapshot.country
  ]
    .filter(Boolean)
    .join(', ');
};

const getStatusNotificationMessage = ({ status, orderId, delayReason }) => {
  const shortId = orderId ? orderId.substring(0, 8) : 'your order';
  switch (status) {
    case 'delayed':
      return `Your order ${shortId} has been delayed. ${delayReason || 'Please allow us some time to sort this out.'}`;
    case 'shipped':
      return `Good news! Your order ${shortId} has shipped and is on its way.`;
    case 'delivered':
      return `Your order ${shortId} has been delivered. We would love to hear your feedback!`;
    case 'placed':
    default:
      return `Your order ${shortId} has been placed successfully.`;
  }
};

const getStatusEmailTemplate = (status, settings = {}) => {
  const customTemplates = settings.statusEmailTemplates || {};
  const whitelistedTemplate = customTemplates[status] || {};
  const fallback = DEFAULT_STATUS_EMAIL_TEMPLATES[status] || DEFAULT_STATUS_EMAIL_TEMPLATES.placed;
  return {
    subject: whitelistedTemplate.subject || fallback.subject,
    body: whitelistedTemplate.body || fallback.body
  };
};

const buildStatusEmailContext = ({ order, tenant, user, status, items, shippingAddress, message }) => {
  const currency = tenant?.settings?.currency || 'INR';
  const normalizedItems = Array.isArray(items) && items.length ? items : order?.items || [];
  const summary = normalizedItems
    .map((item) => {
      const name = item.product?.name || 'Item';
      const qty = item.quantity || 0;
      return `• ${name} × ${qty}`;
    })
    .join('\n');
  const addressString = shippingAddress || formatShippingSnapshot(order?.shippingAddressSnapshot);
  return {
    tenantName: tenant?.name || 'Our Store',
    customerName: user?.name || order?.user?.name || 'Valued Customer',
    customerEmail: user?.email || order?.user?.email,
    status,
    orderId: order?.id || '',
    totalAmount: formatCurrencyWithTenant(order?.totalAmount || 0, currency),
    shippingAddress: addressString,
    itemsSummary: summary || 'Item details not available.',
    orderLink: `${FRONTEND_BASE_URL}/orders/${order?.id}`,
    supportEmail: tenant?.settings?.supportContacts?.email || 'support@example.com',
    supportPhone: tenant?.settings?.supportContacts?.phone || '+91 0000000000',
    message: message || ''
  };
};

const normalizeGiftCardCode = (code = '') => (code || '').toString().trim().toUpperCase();

const sendOrderStatusNotification = async ({ order, tenant, user, status, message, actorId, items, shippingAddress }) => {
  const notificationType = status === 'delayed' ? 'warning' : status === 'delivered' ? 'success' : 'info';
  const notification = await Notification.create({
    tenantId: tenant.id,
    userId: user?.id || order.userId,
    title: 'Order Status Update',
    message,
    type: notificationType,
    referenceId: order.id,
    createdBy: actorId,
    updatedBy: actorId
  });
  emitNotificationEvent(notification.toJSON ? notification.toJSON() : notification);

  if (user?.email) {
    const context = buildStatusEmailContext({ order, tenant, user, status, items, shippingAddress, message });
    const template = getStatusEmailTemplate(status, tenant?.settings);
    const subject = renderInvoiceContent(template.subject, context);
    const bodyText = renderInvoiceContent(template.body, context);
    const htmlBody = `<div style="font-family: system-ui, sans-serif; color:#111; line-height:1.5;">${bodyText
      .split('\n')
      .map((line) => `<p style="margin: 0 0 0.5rem;">${line}</p>`)
      .join('')}</div>`;
    setImmediate(() => {
      sendEmail(user.email, subject, bodyText, htmlBody);
    });
  }
};

const gatherPostalCodes = (regions = []) => {
  const postalSet = new Set();
  regions.forEach((region) => {
    const locations = Array.isArray(region.locations) ? region.locations : [];
    locations.forEach((location) => {
      const locationCodes = (location.postalCodes || []).slice();
      if (location.postalCode) locationCodes.push(location.postalCode);
      if (locationCodes.length) {
        locationCodes.forEach((code) => postalSet.add(code));
      }
    });
  });
  return Array.from(postalSet).slice(0, 12);
};

const buildPostalCoverageMessage = (address, regions, validationMode = 'postal') => {
  if (validationMode === 'country') {
    return 'Delivery coverage is configured nationwide. Please verify your address or reach out to support if you still see this message.';
  }
  if (validationMode === 'state') {
    return 'Delivery coverage is configured state-wise. Please use an address within one of the supported states or contact support for help.';
  }
  if (validationMode === 'city') {
    return 'Delivery coverage is configured city-wise. Please use an address within a supported city or contact support for help.';
  }
  const requiresPostal = regions.some((region) => {
    const locations = Array.isArray(region.locations) ? region.locations : [];
    return locations.some((location) => Array.isArray(location.postalCodes) && location.postalCodes.length);
  });
  if (requiresPostal && !address?.postalCode) {
    return 'Postal code is required to confirm delivery coverage. Please enter the postal code for your shipping address.';
  }

  const hints = gatherPostalCodes(regions);
  if (address?.postalCode && hints.length) {
    return `We do not deliver to postal code ${address.postalCode} yet. Supported pins include ${hints.join(', ')}.`;
  }

  if (hints.length) {
    return `Delivery is not available to this area yet. We currently cover postal codes such as ${hints.join(', ')}.`;
  }

  return 'We do not deliver to the selected location yet. Our logistics team is working to expand coverage.';
};

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.status = 400;
  }
}

const extractWeightKg = (product) => {
  if (!product?.specifications) return null;
  const spec = product.specifications;
  const keys = ['weightKg', 'weight_kg', 'weight', 'weightInKg', 'weight_in_kg'];
  for (const key of keys) {
    if (spec[key] != null && spec[key] !== '') {
      return Number(spec[key]);
    }
  }
  return null;
};

// POST /api/orders
// Customer places an order
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddressId, notes, couponCode, giftCardCode, pointsToRedeem: requestedPointsToRedeem, paymentMethod: requestedPaymentMethodRaw } = req.body;
    const tenantCurrency = req.tenant?.settings?.currency || 'INR';
    const requestedPaymentMethod = (requestedPaymentMethodRaw || '').toLowerCase();
    const codRequested = requestedPaymentMethod === 'cod';
    const codEnabled = Boolean(req.tenant?.settings?.codEnabled);
    if (codRequested && !codEnabled) {
      throw new BadRequestError('Cash on Delivery is not enabled for this store.');
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Please add at least one item to place an order.' });
    }

    // Fetch address for snapshot
    const address = await UserAddress.findOne({ 
      where: { id: shippingAddressId, userId: req.user.id, tenantId: req.tenant.id } 
    });
    if (!address) return res.status(400).json({ success: false, message: 'Invalid address selected' });
    if (!address.postalCode) {
      return res.status(400).json({ success: false, message: 'Postal code is required to validate delivery coverage.' });
    }

    const regions = await DeliveryRegion.findAll({
      where: { tenantId: req.tenant.id, isActive: true },
      order: [['lead_time_days', 'ASC']]
    });
    const pinValidationMode = req.tenant?.settings?.shipping?.pinValidationMode || 'postal';
    const requiresPostal = pinValidationMode === 'postal' && regions.some((region) => {
      const locations = Array.isArray(region.locations) ? region.locations : [];
      return locations.some((location) => Array.isArray(location.postalCodes) && location.postalCodes.length);
    });
    if (requiresPostal && !address.postalCode) {
      return res.status(400).json({ success: false, message: 'Postal code is required to confirm delivery coverage.' });
    }
    console.log('address', address);
    console.log('regions', regions);
    console.log('pinValidationMode', pinValidationMode);
    const matchedRegion = findRegionForAddress(address, regions, pinValidationMode);
    if (!matchedRegion) {
      return res.status(400).json({ success: false, message: buildPostalCoverageMessage(address, regions, pinValidationMode) });
    }

    await sequelize.transaction(async (t) => {
      let subtotal = 0;
      const orderItems = [];

      const restrictions = await DeliveryRestriction.findAll({
        where: { tenantId: req.tenant.id, regionId: matchedRegion.id },
        transaction: t
      });
      const restrictionMap = buildRestrictionMap(restrictions);

      for (const item of items) {
        const product = await Product.findOne({
          where: { id: item.productId, tenantId: req.tenant.id, isActive: true },
          transaction: t
        });
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const stock = await Stock.findOne({
          where: { productId: product.id },
          lock: true,   // row-level lock
          transaction: t
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        await stock.update({
          quantity: stock.quantity - item.quantity,
          updatedBy: req.user.id
        }, { transaction: t });

        const tierRule = await PricingRule.findOne({
          where: {
            tenantId: req.tenant.id,
            productId: product.id,
            isActive: true,
            minQuantity: { [Op.lte]: item.quantity },
            [Op.or]: [
              { startDate: { [Op.lte]: new Date() } },
              { startDate: null }
            ],
            [Op.or]: [
              { endDate: { [Op.gte]: new Date() } },
              { endDate: null }
            ]
          },
          order: [['minQuantity', 'DESC']]
        });
        const productBasePrice = product.salePrice !== null && product.salePrice !== undefined
          ? Number(product.salePrice)
          : Number(product.price);
        const unitPrice = tierRule ? Number(tierRule.price) : productBasePrice;
        subtotal += unitPrice * item.quantity;

        const restriction = getRestrictionForProduct(restrictionMap, product.id, product.category);
        if (restriction) {
          if (!restriction.isAllowed) {
            throw new Error(`${product.name} is not deliverable to ${matchedRegion.name}.`);
          }
          const lineTotal = unitPrice * item.quantity;
          if (restriction.minOrderValue && lineTotal < Number(restriction.minOrderValue)) {
            throw new BadRequestError(
              `${product.name} must meet the minimum value of ${formatCurrencyWithTenant(restriction.minOrderValue, tenantCurrency)} when shipping to ${matchedRegion.name}.`
            );
          }
          const weightPerUnit = extractWeightKg(product);
          if (weightPerUnit && restriction.maxWeightKg && weightPerUnit * item.quantity > Number(restriction.maxWeightKg)) {
            throw new BadRequestError(
              `${product.name} exceeds the ${matchedRegion.name} weight limit of ${restriction.maxWeightKg}kg.`
            );
          }
        }
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          product: {
            name: product.name,
            images: product.images,
            price: product.price,
            salePrice: product.salePrice,
            offerLabel: product.offerLabel,
            offerExpiresAt: product.offerExpiresAt
          },
          createdBy: req.user.id,
          updatedBy: req.user.id
        });
      }

      let discountAmount = 0;
      let couponId = null;

      // 1. Apply Automatic Promotions (e.g., 10% off for orders above 5000)
      const currentTime = new Date();
      const activePromotions = await Promotion.findAll({
        where: { tenantId: req.tenant.id, isActive: true },
        transaction: t
      });
      const validPromotions = activePromotions.filter((promo) => {
        const startsBy = !promo.validFrom || new Date(promo.validFrom) <= currentTime;
        const endsBy = !promo.validTo || new Date(promo.validTo) >= currentTime;
        return startsBy && endsBy;
      });

      for (const promo of validPromotions) {
        if (promo.conditionType === 'min_order_amount' && subtotal >= Number(promo.conditionValue)) {
          let promoDiscount = 0;
          if (promo.discountType === 'percentage') {
            promoDiscount = (subtotal * Number(promo.discountValue)) / 100;
          } else {
            promoDiscount = Number(promo.discountValue);
          }
          discountAmount += promoDiscount;
        }
      }

      const baseAmountAfterPromotions = Math.max(subtotal - discountAmount, 0);

      // 2. Apply Coupon if provided
      if (couponCode) {
        const coupon = await Coupon.findOne({
          where: {
            code: couponCode,
            tenantId: req.tenant.id,
            isActive: true,
            startDate: { [Op.lte]: currentTime },
            endDate: { [Op.gte]: currentTime }
          },
          transaction: t
        });

        if (!coupon) {
          throw new BadRequestError('Invalid or expired coupon code.');
        }

        const canUse = !coupon.isSpecificUser || coupon.userId === req.user.id;
        const meetsMin = baseAmountAfterPromotions >= Number(coupon.minOrderAmount || 0);
        const underLimit = coupon.usageLimit === 0 || coupon.usageCount < coupon.usageLimit;
        if (!canUse) {
          throw new BadRequestError('This coupon is not valid for your account.');
        }
        if (!meetsMin) {
          throw new BadRequestError(`Order must be at least ${formatCurrencyWithTenant(Number(coupon.minOrderAmount || 0), tenantCurrency)} after promotions to use this coupon.`);
        }
        if (!underLimit) {
          throw new BadRequestError('This coupon has reached its usage limit.');
        }

        let couponDiscount = 0;
        if (coupon.discountType === 'percentage') {
          couponDiscount = (baseAmountAfterPromotions * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscountAmount && couponDiscount > Number(coupon.maxDiscountAmount)) {
            couponDiscount = Number(coupon.maxDiscountAmount);
          }
        } else {
          couponDiscount = Number(coupon.discountValue);
        }
        couponDiscount = Math.min(couponDiscount, baseAmountAfterPromotions);
        discountAmount += couponDiscount;
        couponId = coupon.id;
        await coupon.increment('usageCount', { transaction: t });
      }

      // 3. Calculate Shipping Fee (configurable threshold and flat fee)
      const shippingSettings = req.tenant?.settings?.shipping || {};
      const addressSnapshot = address.toJSON ? address.toJSON() : address;
      const shippingZone = determineShippingZone({ origin: shippingSettings.origin || {}, address: addressSnapshot });
      const shippingFee = calculateShippingFee({ shippingSettings, address: addressSnapshot, cartTotal: subtotal });
      const { rate: taxRate, label: taxLabel } = resolveTaxConfig({ tenant: req.tenant, region: matchedRegion });
      const netAmount = Math.max(subtotal - discountAmount, 0);
      const taxAmount = taxRate > 0 ? (netAmount * taxRate) / 100 : 0;
      const amountBeforeGiftCard = netAmount + shippingFee + taxAmount;
      let giftCardDeduction = 0;
      let appliedGiftCard = null;
      const normalizedGiftCard = giftCardCode ? normalizeGiftCardCode(giftCardCode) : '';
      if (normalizedGiftCard) {
        appliedGiftCard = await GiftCard.findOne({
          where: {
            tenantId: req.tenant.id,
            code: normalizedGiftCard,
            isActive: true
          },
          lock: t.LOCK.UPDATE,
          transaction: t
        });
        if (!appliedGiftCard) {
          throw new BadRequestError('Gift card not found or inactive.');
        }
        if (appliedGiftCard.expiresAt && new Date(appliedGiftCard.expiresAt) < new Date()) {
          throw new BadRequestError('Gift card has expired.');
        }
        const balance = Number(appliedGiftCard.balance || 0);
        if (balance <= 0) {
          throw new BadRequestError('Gift card has no remaining balance.');
        }
        giftCardDeduction = Math.min(balance, amountBeforeGiftCard);
      }
      let amountDue = Math.max(amountBeforeGiftCard - giftCardDeduction, 0);
      const loyaltyConfig = req.tenant?.settings?.loyalty || {};
      const pointsPerCurrency = Math.max(0, Number(loyaltyConfig.pointsPerCurrency || 0));
      const valuePerPoint = Math.max(0, Number(loyaltyConfig.valuePerPoint || 0));
      const redemptionEnabled = loyaltyConfig.redemptionEnabled !== false;
      let pointsRedeemed = 0;
      let pointsDeduction = 0;
      let pointsBalanceBefore = 0;
      if (redemptionEnabled && valuePerPoint > 0 && pointsPerCurrency > 0) {
        pointsBalanceBefore = await calculateBalance({
          tenantId: req.tenant.id,
          userId: req.user.id,
          transaction: t
        });
        const requestedPoints = Math.max(0, Number(requestedPointsToRedeem || 0));
        const maxPointsByAmount = Math.floor(amountDue / valuePerPoint);
        const usablePoints = Math.min(requestedPoints, pointsBalanceBefore, maxPointsByAmount);
        if (usablePoints > 0) {
          pointsRedeemed = usablePoints;
          pointsDeduction = pointsRedeemed * valuePerPoint;
          amountDue = Math.max(amountDue - pointsDeduction, 0);
        }
      }

      const order = await Order.create({
        tenantId: req.tenant.id,
        userId: req.user.id,
        status: 'pending',
        totalAmount: amountBeforeGiftCard,
        discountAmount,
        shippingFee,
        taxRate,
        taxAmount,
        taxLabel,
        couponId,
        shippingAddressId: address.id,
        shippingAddressSnapshot: address.toJSON(),
        notes,
        deliveryRegionId: matchedRegion.id,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      for (const oi of orderItems) {
        oi.orderId = order.id;
        await OrderItem.create(oi, { transaction: t });
      }

      if (giftCardDeduction > 0 && appliedGiftCard) {
        const remainingBalance = Math.max(0, Number(appliedGiftCard.balance || 0) - giftCardDeduction);
        await appliedGiftCard.update({
          balance: remainingBalance,
          updatedBy: req.user.id
        }, { transaction: t });

        await GiftCardRedemption.create({
          tenantId: req.tenant.id,
          giftCardId: appliedGiftCard.id,
          orderId: order.id,
          userId: req.user.id,
          amount: giftCardDeduction,
          metadata: { code: appliedGiftCard.code },
          createdBy: req.user.id,
          updatedBy: req.user.id
        }, { transaction: t });
      }

      if (pointsRedeemed > 0) {
        await recordEntry({
          tenantId: req.tenant.id,
          userId: req.user.id,
          orderId: order.id,
          points: pointsRedeemed,
          type: 'redeemed',
          reason: `Redeemed on order ${order.id}`,
          metadata: { amount: pointsDeduction },
          transaction: t
        });
      }

      let pointsEarned = 0;
      if (pointsPerCurrency > 0) {
        pointsEarned = Math.floor(amountBeforeGiftCard * pointsPerCurrency);
        if (pointsEarned > 0) {
          await recordEntry({
            tenantId: req.tenant.id,
            userId: req.user.id,
            orderId: order.id,
            points: pointsEarned,
            type: 'earned',
            reason: `Earned from order ${order.id}`,
            metadata: { amount: amountBeforeGiftCard },
            transaction: t
          });
        }
      }

      const pointsBalanceAfter = await calculateBalance({
        tenantId: req.tenant.id,
        userId: req.user.id,
        transaction: t
      });

      let template = await InvoiceTemplate.findOne({ where: { tenantId: req.tenant.id }, transaction: t });
      if (!template) {
        template = await InvoiceTemplate.create({
          tenantId: req.tenant.id,
          name: 'Default Invoice',
          body: defaultTemplate,
          createdBy: req.user.id,
          updatedBy: req.user.id
        }, { transaction: t });
      }

      const shippingAddress = address.toJSON();
      const shippingLabel = [
        shippingAddress.addressLine1,
        shippingAddress.addressLine2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postalCode,
        shippingAddress.country,
      ].filter(Boolean).join(', ');

      const invoiceNumber = createInvoiceNumber();
      const tenantTemplateBody = (req.tenant?.settings?.invoiceTemplate || '').trim();
      const templateBody = tenantTemplateBody || template.body || defaultTemplate;
      const paymentGatewayLabel = codRequested
        ? 'Cash on Delivery'
        : (req.tenant?.settings?.paymentGateway || 'Mock Gateway').replace(/_/g, ' ');
      let paymentMethodLabel = paymentGatewayLabel;
      if (giftCardDeduction > 0 && appliedGiftCard) {
        paymentMethodLabel = amountDue > 0
          ? `Gift Card (${appliedGiftCard.code}) + ${paymentGatewayLabel}`
          : `Gift Card (${appliedGiftCard.code})`;
      }
      const invoiceContext = buildInvoiceContext({
        tenant: req.tenant,
        invoiceNumber,
        orderId: order.id,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        customer: req.user,
        shippingAddress: shippingLabel || 'Not provided',
        items: orderItems,
        subtotalValue: subtotal,
        shippingFeeValue: shippingFee,
        discountValue: discountAmount,
        taxRateValue: taxRate,
        taxLabelValue: taxLabel,
        giftCardDeductionValue: giftCardDeduction,
        pointsDeductionValue: pointsDeduction,
        pointsEarnedValue: pointsEarned,
        amountDueValue: amountDue,
        paymentMethodLabel,
        notes: notes || 'No additional notes',
        currencyCode: tenantCurrency
      });

      const invoiceContent = renderInvoiceContent(templateBody, invoiceContext);

      await OrderInvoice.create({
        tenantId: req.tenant.id,
        orderId: order.id,
        templateId: template.id,
        invoiceNumber,
        content: invoiceContent,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      // Create a pending payment record
      const resolvedPaymentMethod = codRequested ? 'cod' : (amountDue > 0 ? (req.tenant?.settings?.paymentGateway || 'mock') : 'gift_card');
      const resolvedGatewayId = codRequested ? 'cod' : (req.tenant?.settings?.paymentGateway || 'mock');
      const paymentRecord = await Payment.create({
        tenantId: req.tenant.id,
        orderId: order.id,
        amount: amountDue,
        status: amountDue > 0 ? 'pending' : 'success',
        paymentMethod: resolvedPaymentMethod,
        gatewayId: resolvedGatewayId,
        metadata: {
          invoiceNumber,
          currency: tenantCurrency,
          taxRate,
          taxLabel,
          taxAmount,
          tenant: req.tenant?.slug,
          cod: codRequested,
          ...(giftCardDeduction > 0 && appliedGiftCard ? {
            giftCard: {
              code: appliedGiftCard.code,
              deduction: giftCardDeduction
            }
          } : {}),
          ...(pointsDeduction > 0 ? {
            loyalty: {
              points: pointsRedeemed,
              deduction: pointsDeduction
            }
          } : {})
        },
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      const placedMessage = getStatusNotificationMessage({ status: 'placed', orderId: order.id });
      await sendOrderStatusNotification({
        order,
        tenant: req.tenant,
        user: req.user,
        status: 'placed',
        message: placedMessage,
        actorId: req.user.id,
        items: orderItems,
        shippingAddress: shippingLabel || formatShippingSnapshot(order.shippingAddressSnapshot)
      });

      res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          paymentId: paymentRecord.id,
          paymentMethod: resolvedPaymentMethod,
          isCod: resolvedPaymentMethod === 'cod',
          totalAmount: amountBeforeGiftCard,
          amountDue,
          giftCardDeduction,
          pointsDeduction,
          pointsRedeemed,
          pointsEarned,
          loyaltyBalance: pointsBalanceAfter
        }
      });
    });
  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    if (err.message.includes('Insufficient stock') || err.message.includes('not found')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// GET /api/orders
const listOrders = async (req, res, next) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const { status, startDate, endDate, q, sort } = req.query;

    const where = { tenantId: req.tenant.id };
    if (req.user.role === 'customer') {
      where.userId = req.user.id;
    }
    
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [dayjs(startDate).startOf('day').toDate(), dayjs(endDate).endOf('day').toDate()] };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: dayjs(startDate).startOf('day').toDate() };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: dayjs(endDate).endOf('day').toDate() };
    }

    if (q) {
      where.id = { [Op.iLike]: `%${q}%` };
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'date_asc') order = [['created_at', 'ASC']];
    else if (sort === 'amount_desc') order = [['totalAmount', 'DESC']];
    else if (sort === 'amount_asc') order = [['totalAmount', 'ASC']];

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Payment, as: 'payment', attributes: ['id', 'status', 'paymentMethod', 'amount'] },
        { model: DeliveryRegion, as: 'deliveryRegion', attributes: ['id', 'name', 'leadTimeDays'] },
        { 
          model: OrderItem, as: 'items', 
          include: [{ model: Product, as: 'product', attributes: ['name', 'images'] }] 
        }
      ],
      order,
      limit,
      offset,
    });
    const orderPayload = rows.map(order => order.toJSON());

    let reviewMap = {};
    if (req.user && req.user.role === 'customer') {
      const productIds = Array.from(new Set(orderPayload.flatMap(order => (order.items || []).map(item => item.productId))));
      if (productIds.length) {
        const reviews = await ProductReview.findAll({
          where: {
            tenantId: req.tenant.id,
            userId: req.user.id,
            productId: productIds
          }
        });
        reviewMap = reviews.reduce((acc, review) => {
          acc[review.productId] = review;
          return acc;
        }, {});
      }
    }
    const regionIds = Array.from(new Set(orderPayload.map((order) => order.deliveryRegionId).filter(Boolean)));
    const restrictionsByRegion = {};
    if (regionIds.length) {
      const regionRestrictions = await DeliveryRestriction.findAll({
        where: { tenantId: req.tenant.id, regionId: regionIds }
      });
      regionRestrictions.forEach((restriction) => {
        const regionKey = restriction.regionId;
        if (!restrictionsByRegion[regionKey]) {
          restrictionsByRegion[regionKey] = [];
        }
        restrictionsByRegion[regionKey].push(restriction);
      });
    }

    const ordersWithReviewFlag = orderPayload.map((order) => {
      const regionRestrictions = restrictionsByRegion[order.deliveryRegionId] || [];
      const restrictionMap = buildRestrictionMap(regionRestrictions);
      return {
        ...order,
        items: (order.items || []).map((item) => {
          const hasReview = Boolean(reviewMap[item.productId]);
          const restriction = getRestrictionForProduct(restrictionMap, item.productId, item.product?.category);
          return {
            ...item,
            reviewed: hasReview,
            reviewId: reviewMap[item.productId]?.id || null,
            restriction: restriction
              ? {
                  isAllowed: restriction.isAllowed,
                  allowReturn: restriction.allowReturn,
                  allowReplacement: restriction.allowReplacement,
                  minOrderValue: restriction.minOrderValue ? Number(restriction.minOrderValue) : null,
                  maxWeightKg: restriction.maxWeightKg ? Number(restriction.maxWeightKg) : null,
                  notes: restriction.notes
                }
              : null
          };
        }),
        restrictionFlags: regionRestrictions.map((restriction) => ({
          category: restriction.category,
          isAllowed: restriction.isAllowed,
          allowReturn: restriction.allowReturn,
          allowReplacement: restriction.allowReplacement,
          minOrderValue: restriction.minOrderValue ? Number(restriction.minOrderValue) : null,
          maxWeightKg: restriction.maxWeightKg ? Number(restriction.maxWeightKg) : null,
          notes: restriction.notes
        }))
      };
    });

    const paginationMeta = buildPaginationMeta(count, { page, limit });
    res.json({ success: true, data: ordersWithReviewFlag, pagination: paginationMeta });
  } catch (err) { next(err); }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const where = { id: req.params.id, tenantId: req.tenant.id };
    if (req.user.role === 'customer') where.userId = req.user.id;

    const order = await Order.findOne({
      where,
      include: [
        { model: Payment, as: 'payment' },
        { model: DeliveryRegion, as: 'deliveryRegion', attributes: ['id', 'name', 'leadTimeDays'] },
        { 
          model: OrderItem, as: 'items', 
          include: [{ model: Product, as: 'product', attributes: ['name', 'images', 'category'] }] 
        }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// PATCH /api/orders/:id/status (Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, delayReason } = req.body;
    const order = await Order.findOne({ 
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: [
        { model: User, as: 'user', attributes: ['email', 'name'] },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name'] }] }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const oldStatus = order.status;
    await order.update({ status, updatedBy: req.user.id });
    
    if (oldStatus !== status) {
      const message = getStatusNotificationMessage({ status, orderId: order.id, delayReason });
      await sendOrderStatusNotification({
        order,
        tenant: req.tenant,
        user: order.user,
        status,
        message,
        actorId: req.user.id,
        items: order.items,
        shippingAddress: formatShippingSnapshot(order.shippingAddressSnapshot)
      });
    }

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Return/Replacement Endpoints
const requestReturn = async (req, res, next) => {
  try {
    const { type = 'return', reason, comment } = req.body;
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id, tenantId: req.tenant.id } });
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned or replaced.' });
    }

    let uploadedAttachments = [];
    if (req.files && req.files.length > 0) {
      uploadedAttachments = await Promise.all(
        req.files.map(file => uploadToS3(file.buffer, file.mimetype, 'returns'))
      );
    }

    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
      include: [{ model: Product, attributes: ['id', 'name', 'category', 'specifications'] }]
    });

    const restrictions = await DeliveryRestriction.findAll({
      where: { tenantId: req.tenant.id, regionId: order.deliveryRegionId }
    });
    const restrictionMap = buildRestrictionMap(restrictions);
    const actionKey = type === 'replacement' ? 'allowReplacement' : 'allowReturn';
    const blockedItem = orderItems.find((item) => {
      const restriction = getRestrictionForProduct(restrictionMap, item.productId, item.product?.category);
      return restriction && restriction[actionKey] === false;
    });
    if (blockedItem) {
      return res.status(400).json({
        success: false,
        message: `${blockedItem.product?.name || 'This item'} cannot be ${type === 'replacement' ? 'replaced' : 'returned'} from this area.`
      });
    }

    const returnRequest = await OrderReturn.create({
      tenantId: req.tenant.id,
      orderId: order.id,
      type,
      reason,
      customerComment: comment,
      attachments: uploadedAttachments,
      status: 'pending',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: returnRequest });
  } catch (err) { next(err); }
};

const listReturns = async (req, res, next) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const { status, q } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { orderId: { [Op.iLike]: `%${q}%` } },
        { '$order.user.name$': { [Op.iLike]: `%${q}%` } }
      ];
    }
    const { count, rows } = await OrderReturn.findAndCountAll({
      where,
      include: [
        { 
          model: Order, as: 'order',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email'] },
            { model: Payment, as: 'payment', attributes: ['id', 'status', 'paymentMethod'] }
          ]
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
  } catch (err) { next(err); }
};

const updateReturnStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const returnRequest = await OrderReturn.findOne({ where: { id: req.params.id, tenantId: req.tenant.id } });
    if (!returnRequest) return res.status(404).json({ success: false, message: 'Return request not found.' });

    await returnRequest.update({ status, adminNotes, updatedBy: req.user.id });
    res.json({ success: true, data: returnRequest });
  } catch (err) { next(err); }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findOne({ where: { orderId: req.params.orderId, tenantId: req.tenant.id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

    await payment.update({ status, updatedBy: req.user.id });
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
};

const collectCodPayment = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: [
        { model: Payment, as: 'payment' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['name'] }]
        }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const payment = order.payment;
    if (!payment || payment.paymentMethod !== 'cod') {
      return res.status(400).json({ success: false, message: 'No COD payment found for this order.' });
    }
    if (['success', 'completed'].includes(payment.status)) {
      return res.status(400).json({ success: false, message: 'COD payment already collected.' });
    }

    await payment.update({ status: 'success', updatedBy: req.user.id });
    const updatedOrder = await order.update({
      status: req.body.status || 'delivered',
      updatedBy: req.user.id
    });

    const notificationMessage = getStatusNotificationMessage({ status: 'delivered', orderId: order.id });
    await sendOrderStatusNotification({
      order: updatedOrder,
      tenant: req.tenant,
      user: order.user,
      status: 'delivered',
      message: notificationMessage,
      actorId: req.user.id,
      items: order.items,
      shippingAddress: formatShippingSnapshot(updatedOrder.shippingAddressSnapshot)
    });

    res.json({ success: true, data: { order: updatedOrder, payment } });
  } catch (err) { next(err); }
};

const getOrderInvoice = async (req, res, next) => {
  try {
    const invoice = await OrderInvoice.findOne({
      where: { orderId: req.params.id, tenantId: req.tenant.id },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: OrderItem, as: 'items' }
          ]
        },
        { association: 'template' }
      ]
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    if (req.user.role === 'customer' && invoice.order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

const downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await OrderInvoice.findOne({
      where: { orderId: req.params.id, tenantId: req.tenant.id },
      include: [
        {
          association: 'order',
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
            { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }] },
            { model: Payment, as: 'payment', attributes: ['paymentMethod', 'status'], required: false }
          ]
        }
      ]
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const order = invoice.order;
    if (req.user.role === 'customer' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const orderItems = order.items || [];

    // Reconstruct deductions from related records
    const [gcRedemptions, loyaltyRedeems] = await Promise.all([
      GiftCardRedemption.findAll({ where: { orderId: order.id, tenantId: req.tenant.id } }),
      LoyaltyPoint.findAll({ where: { orderId: order.id, tenantId: req.tenant.id, type: 'redeemed' } }).catch(() => [])
    ]);

    const giftCardDeductionValue = gcRedemptions.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const pointsDeductionValue = loyaltyRedeems.reduce((sum, r) => sum + Number(r.points || 0), 0);
    const subtotalValue = orderItems.reduce((sum, i) => sum + Number(i.unitPrice) * Number(i.quantity), 0);
    const paymentMethod = order.payment?.paymentMethod || order.payment?.status || 'Online Payment';

    const ctx = buildInvoiceContext({
      tenant: req.tenant,
      invoiceNumber: invoice.invoiceNumber,
      orderId: order.id,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN'),
      customer: order.user,
      shippingAddress: formatShippingSnapshot(order.shippingAddressSnapshot),
      items: orderItems,
      subtotalValue,
      shippingFeeValue: order.shippingFee,
      discountValue: order.discountAmount,
      taxRateValue: order.taxRate,
      taxLabelValue: order.taxLabel,
      giftCardDeductionValue,
      pointsDeductionValue,
      amountDueValue: order.totalAmount,
      paymentMethodLabel: paymentMethod.replace(/_/g, ' '),
      notes: order.notes || req.tenant?.settings?.invoiceNotes || 'No additional notes',
      currencyCode: req.tenant?.settings?.currency || 'INR'
    });

    const buffer = await createInvoicePdfBuffer(ctx, orderItems);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber || invoice.id}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  getOrderInvoice,
  downloadInvoicePdf,
  updateOrderStatus,
  requestReturn,
  listReturns,
  updateReturnStatus,
  updatePaymentStatus,
  collectCodPayment
};
