'use strict';
const { Coupon, User } = require('../../models');
const { Op } = require('sequelize');

// GET /api/coupons
const listCoupons = async (req, res, next) => {
  try {
    const where = { tenantId: req.tenant.id };
    if (req.user.role === 'customer') {
      where.isActive = true;
      where[Op.or] = [
        { isSpecificUser: false },
        { userId: req.user.id }
      ];
    }
    const coupons = await Coupon.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
};

// POST /api/coupons (Admin)
const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      tenantId: req.tenant.id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

// POST /api/coupons/validate (Customer)
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({
      where: {
        code,
        tenantId: req.tenant.id,
        isActive: true,
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });

    if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    if (coupon.isSpecificUser && coupon.userId !== req.user.id) {
      return res.status(400).json({ success: false, message: 'This coupon is not valid for your account' });
    }

    if (orderAmount < Number(coupon.minOrderAmount)) {
      return res.status(400).json({ success: false, message: `Minimum order amount for this coupon is $${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
        discount = Number(coupon.maxDiscountAmount);
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    res.json({ success: true, data: { couponId: coupon.id, discount } });
  } catch (err) { next(err); }
};

module.exports = { listCoupons, createCoupon, validateCoupon };
