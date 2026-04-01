'use strict';
const { LoyaltyPoint } = require('../models');

const calculateBalance = async ({ tenantId, userId, transaction = null }) => {
  const where = { tenantId, userId };
  const entries = await LoyaltyPoint.findAll({
    where,
    attributes: ['points', 'type'],
    transaction
  });

  return entries.reduce((sum, entry) => {
    if (entry.type === 'earned') return sum + Number(entry.points);
    return sum - Number(entry.points);
  }, 0);
};

const recordEntry = async ({ tenantId, userId, orderId = null, points, type, reason = '', metadata = {}, transaction = null }) => {
  if (!['earned', 'redeemed'].includes(type)) {
    throw new Error('Invalid loyalty entry type');
  }
  return LoyaltyPoint.create({
    tenantId,
    userId,
    orderId,
    points,
    type,
    reason,
    metadata
  }, { transaction });
};

module.exports = {
  calculateBalance,
  recordEntry
};
