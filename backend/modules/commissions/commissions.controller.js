'use strict';
const { InventoryTransfer, BillingRecord, CommissionSetting, User } = require('../../models');
const { Op } = require('sequelize');

const exportCommissionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.tenant.id;

    const where = { tenantId };
    if (startDate) where.created_at = { ...where.created_at, [Op.gte]: new Date(startDate) };
    if (endDate) where.created_at = { ...where.created_at, [Op.lte]: new Date(endDate) };

    const transfers = await InventoryTransfer.findAll({
      where,
      include: [{ association: 'salesPerson', attributes: ['id', 'name', 'email'] }]
    });

    const settings = await CommissionSetting.findAll({
      where: { tenantId }
    });

    const mapSettings = new Map();
    settings.forEach((setting) => {
      mapSettings.set(setting.salesPersonId || 'default', setting);
    });

    const rows = transfers.map((transfer) => {
      const setting = mapSettings.get(transfer.salesPersonId) || mapSettings.get('default');
      const rate = setting ? Number(setting.percentage) || 0 : 0;
      const flat = setting ? Number(setting.flatAmount) || 0 : 0;
      const revenue = Number(transfer.totalAmount) || 0;
      const commission = (revenue * rate) / 100 + flat;
      return {
        transferId: transfer.id,
        salesperson: transfer.salesPerson?.name || 'Unassigned',
        email: transfer.salesPerson?.email || '',
        revenue: revenue.toFixed(2),
        commission: commission.toFixed(2),
        status: transfer.status
      };
    });

    const header = ['Transfer ID', 'Salesperson', 'Email', 'Revenue', 'Commission', 'Status'];
    const csv = [header, ...rows.map((row) => [
      row.transferId,
      row.salesperson,
      row.email,
      row.revenue,
      row.commission,
      row.status
    ])].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="commission-report.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportCommissionReport };
