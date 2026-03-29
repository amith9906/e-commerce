'use strict';
const { PricingRule } = require('../../models');

const createPricingRule = async (req, res, next) => {
  try {
    const { productId, minQuantity, price, label, storeId, startDate, endDate } = req.body;
    if (!productId || !minQuantity || !price) {
      return res.status(400).json({ success: false, message: 'productId, minQuantity, and price are required.' });
    }

    const rule = await PricingRule.create({
      tenantId: req.tenant.id,
      productId,
      minQuantity,
      price,
      label,
      storeId: storeId || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

const listPricingRules = async (req, res, next) => {
  try {
    const rules = await PricingRule.findAll({
      where: { tenantId: req.tenant.id },
      order: [['minQuantity', 'DESC']]
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPricingRule, listPricingRules };
