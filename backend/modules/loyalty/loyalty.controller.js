'use strict';
const { LoyaltyPoint } = require('../../models');
const { calculateBalance } = require('../../utils/loyalty');

const getBalance = async (req, res, next) => {
  try {
    const balance = await calculateBalance({
      tenantId: req.tenant.id,
      userId: req.user.id
    });
    res.json({
      success: true,
      data: { balance }
    });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await LoyaltyPoint.findAndCountAll({
      where: { tenantId: req.tenant.id, userId: req.user.id },
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json({
      success: true,
      data: {
        total: count,
        history: rows
      }
    });
  } catch (err) {
    next(err);
  }
};

const getAdminSummary = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const [earned, redeemed] = await Promise.all([
      LoyaltyPoint.sum('points', { where: { tenantId, type: 'earned' } }),
      LoyaltyPoint.sum('points', { where: { tenantId, type: 'redeemed' } })
    ]);
    const earnedValue = Number(earned || 0);
    const redeemedValue = Number(redeemed || 0);
    res.json({
      success: true,
      data: {
        earned: earnedValue,
        redeemed: redeemedValue,
        outstanding: earnedValue - redeemedValue
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBalance, getHistory, getAdminSummary };
