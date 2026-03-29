const { Order, OrderItem, Stock, Product, Payment, UserAddress, Notification, User, Coupon, Promotion, OrderReturn } = require('../../models');
const { sendEmail } = require('../../utils/mailer');
const sequelize = require('../../config/database');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// POST /api/orders
// Customer places an order
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddressId, notes, couponCode } = req.body;
    // items should be [{ productId, quantity }]

    // Fetch address for snapshot
    const address = await UserAddress.findOne({ 
      where: { id: shippingAddressId, userId: req.user.id, tenantId: req.tenant.id } 
    });
    if (!address) return res.status(400).json({ success: false, message: 'Invalid address selected' });

    await sequelize.transaction(async (t) => {
      let subtotal = 0;
      const orderItems = [];

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

        const unitPrice = Number(product.price);
        subtotal += unitPrice * item.quantity;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          createdBy: req.user.id,
          updatedBy: req.user.id
        });
      }

      let discountAmount = 0;
      let couponId = null;

      // 1. Apply Automatic Promotions (e.g., 10% off for orders above 5000)
      const activePromotions = await Promotion.findAll({
        where: { tenantId: req.tenant.id, isActive: true },
        transaction: t
      });

      for (const promo of activePromotions) {
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

      // 2. Apply Coupon if provided
      if (couponCode) {
        const coupon = await Coupon.findOne({
          where: {
            code: couponCode,
            tenantId: req.tenant.id,
            isActive: true,
            startDate: { [Op.lte]: new Date() },
            endDate: { [Op.gte]: new Date() }
          },
          transaction: t
        });

        if (coupon) {
          const canUse = !coupon.isSpecificUser || coupon.userId === req.user.id;
          const meetsMin = subtotal >= Number(coupon.minOrderAmount);
          const underLimit = coupon.usageLimit === 0 || coupon.usageCount < coupon.usageLimit;

          if (canUse && meetsMin && underLimit) {
            let couponDiscount = 0;
            if (coupon.discountType === 'percentage') {
              couponDiscount = (subtotal * Number(coupon.discountValue)) / 100;
              if (coupon.maxDiscountAmount && couponDiscount > Number(coupon.maxDiscountAmount)) {
                couponDiscount = Number(coupon.maxDiscountAmount);
              }
            } else {
              couponDiscount = Number(coupon.discountValue);
            }
            
            discountAmount += couponDiscount;
            couponId = coupon.id;
            
            // Update coupon usage count
            await coupon.increment('usageCount', { transaction: t });
          }
        }
      }

      // 3. Calculate Shipping Fee ($50 flat, free if subtotal > 2000)
      let shippingFee = subtotal > 2000 ? 0 : 50;

      // 4. Final Total
      const finalTotal = subtotal - discountAmount + shippingFee;

      const order = await Order.create({
        tenantId: req.tenant.id,
        userId: req.user.id,
        status: 'pending',
        totalAmount: finalTotal,
        discountAmount,
        shippingFee,
        couponId,
        shippingAddressId: address.id,
        shippingAddressSnapshot: address.toJSON(),
        notes,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      for (const oi of orderItems) {
        oi.orderId = order.id;
        await OrderItem.create(oi, { transaction: t });
      }

      // Create a pending payment record
      await Payment.create({
        tenantId: req.tenant.id,
        orderId: order.id,
        amount: finalTotal,
        status: 'pending',
        paymentMethod: 'online', 
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction: t });

      res.status(201).json({ success: true, data: { orderId: order.id, totalAmount: finalTotal } });
    });
  } catch (err) {
    if (err.message.includes('Insufficient stock') || err.message.includes('not found')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// GET /api/orders
const listOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate, q, sort, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

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
        { model: Payment, as: 'payment', attributes: ['status', 'paymentMethod'] },
        { 
          model: OrderItem, as: 'items', 
          include: [{ model: Product, as: 'product', attributes: ['name', 'images'] }] 
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
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
      include: [{ model: User, as: 'user', attributes: ['email', 'name'] }]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const oldStatus = order.status;
    await order.update({ status, updatedBy: req.user.id });
    
    if (oldStatus !== status) {
      const message = status === 'delayed' && delayReason 
        ? `Your order ${order.id.substring(0,8)} has been delayed: ${delayReason}`
        : `Your order ${order.id.substring(0,8)} status updated to: ${status}`;
        
      await Notification.create({
        tenantId: req.tenant.id,
        userId: order.userId,
        title: `Order Status Update`,
        message,
        type: status === 'delayed' ? 'warning' : 'info',
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      if (status === 'delayed' && order.user?.email) {
        setImmediate(async () => {
          await sendEmail(
            order.user.email,
            'Important Update Regarding Your Order',
            `Hi ${order.user.name}, your order has been delayed. Reason: ${delayReason || 'Unexpected delay'}.`,
            `<h3>Order Update</h3><p>Hi ${order.user.name},</p><p>We apologize, but your order <strong>${order.id}</strong> has been delayed.</p><p><strong>Reason:</strong> ${delayReason || 'Unexpected logistics delay'}</p>`
          );
        });
      }
    }

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Return/Replacement Endpoints
const requestReturn = async (req, res, next) => {
  try {
    const { type, reason } = req.body;
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id, tenantId: req.tenant.id } });
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned or replaced.' });
    }

    const returnRequest = await OrderReturn.create({
      tenantId: req.tenant.id,
      orderId: order.id,
      type,
      reason,
      status: 'pending',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: returnRequest });
  } catch (err) { next(err); }
};

const listReturns = async (req, res, next) => {
  try {
    const returns = await OrderReturn.findAll({
      where: { tenantId: req.tenant.id },
      include: [
        { 
          model: Order, as: 'order',
          include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: returns });
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

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus, requestReturn, listReturns, updateReturnStatus, updatePaymentStatus };
