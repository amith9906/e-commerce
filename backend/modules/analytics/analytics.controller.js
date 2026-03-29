'use strict';
const { ProductView, Order, OrderItem, Payment, User, Product, BillingRecord, InventoryTransfer } = require('../../models');
const { fn, col, literal } = require('sequelize');

// GET /api/analytics/sales (Admin)
const getSalesStats = async (req, res, next) => {
  try {
    const stats = await Order.findAll({
      where: { tenantId: req.tenant.id },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalRevenue']
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'DESC']],
      limit: 30
    });
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

// GET /api/analytics/views (Admin)
const getTopViewedProducts = async (req, res, next) => {
  try {
    const views = await ProductView.findAll({
      where: { tenantId: req.tenant.id },
      attributes: [
        'product_id',
        [fn('COUNT', col('ProductView.id')), 'viewCount']
      ],
      group: ['product_id', 'product.id'],
      include: [{ association: 'product', attributes: ['name', 'images'] }],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10
    });
    res.json({ success: true, data: views });
  } catch (err) { next(err); }
};

// GET /api/analytics/sales/state (Admin)
const getStateSalesStats = async (req, res, next) => {
  try {
    const stats = await Order.findAll({
      where: { tenantId: req.tenant.id },
      attributes: [
        [literal(`shipping_address_snapshot->>'state'`), 'state'],
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalRevenue']
      ],
      group: [literal(`shipping_address_snapshot->>'state'`)],
      order: [[fn('SUM', col('total_amount')), 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

// GET /api/analytics/products/topselling (Admin)
const getTopSellingProducts = async (req, res, next) => {
  try {
    const sales = await OrderItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', literal('quantity * unit_price')), 'totalRevenue']
      ],
      include: [
        { model: Order, as: 'order', attributes: [], where: { tenantId: req.tenant.id } },
        { model: Product, as: 'product', attributes: ['name', 'images'] }
      ],
      group: ['product_id', 'product.id'],
      order: [[fn('SUM', literal('quantity * unit_price')), 'DESC']],
      limit: 10
    });
    res.json({ success: true, data: sales });
  } catch (err) { next(err); }
};

// GET /api/analytics/stats (Admin)
const getBasicStats = async (req, res, next) => {
  try {
    const activeUsers = await User.count({ where: { tenantId: req.tenant.id, isActive: true } });
    const totalProducts = await Product.count({ where: { tenantId: req.tenant.id, isActive: true } });
    res.json({ success: true, data: { activeUsers, totalProducts } });
  } catch (err) { next(err); }
};

const getStoreRevenueStats = async (req, res, next) => {
  try {
    const revenue = await BillingRecord.findAll({
      attributes: [
        'store_id',
        [fn('SUM', col('amount')), 'totalRevenue'],
        [fn('COUNT', col('id')), 'invoiceCount']
      ],
      where: { tenantId: req.tenant.id },
      group: ['store_id'],
      include: [{ association: 'store', attributes: ['name'] }],
      order: [[fn('SUM', col('amount')), 'DESC']]
    });
    res.json({ success: true, data: revenue });
  } catch (err) { next(err); }
};

const getSalesPersonPerformance = async (req, res, next) => {
  try {
    const stats = await InventoryTransfer.findAll({
      attributes: [
        'sales_person_id',
        [fn('SUM', col('quantity')), 'totalUnits'],
        [fn('SUM', col('total_amount')), 'totalAmount']
      ],
      where: { tenantId: req.tenant.id },
      group: ['sales_person_id'],
      include: [{ association: 'salesPerson', attributes: ['name', 'email'] }],
      order: [[fn('SUM', col('total_amount')), 'DESC']]
    });
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

module.exports = {
  getSalesStats,
  getTopViewedProducts,
  getBasicStats,
  getStateSalesStats,
  getTopSellingProducts,
  getStoreRevenueStats,
  getSalesPersonPerformance
};
