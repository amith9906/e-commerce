'use strict';
const { Coupon, User } = require('../../models');
const { Op } = require('sequelize');
const { formatCurrency } = require('../../utils/currency');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

// GET /api/coupons
const listCoupons = async (req, res, next) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const where = { tenantId: req.tenant.id };
    if (req.user.role === 'customer') {
      where.isActive = true;
      where[Op.or] = [
        { isSpecificUser: false },
        { userId: req.user.id }
      ];
    }
    const { count, rows } = await Coupon.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: buildPaginationMeta(count, { page, limit }) });
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

    const tenantCurrency = req.tenant?.settings?.currency || 'INR';
    if (orderAmount < Number(coupon.minOrderAmount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ${formatCurrency(coupon.minOrderAmount, tenantCurrency)}`
      });
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

// DELETE /api/coupons/:id (Admin)
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findOne({ where: { id: req.params.id, tenantId: req.tenant.id } });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    await coupon.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { listCoupons, createCoupon, validateCoupon, deleteCoupon };
