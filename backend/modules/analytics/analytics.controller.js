'use strict';
const { ProductView, Order, OrderItem, Payment, User, Product, BillingRecord, InventoryTransfer, Store, StoreRevenueSummary, SalesPersonPerformanceSummary } = require('../../models');
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
      order: [[fn('COUNT', col('ProductView.id')), 'DESC']],
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
    const revenue = await StoreRevenueSummary.findAll({
      where: { tenantId: req.tenant.id },
      include: [{ association: 'store', attributes: ['name'] }],
      order: [['totalRevenue', 'DESC']]
    });

    const data = revenue.map((row) => ({
      storeId: row.storeId,
      storeName: row.store?.name || 'Unknown store',
      totalRevenue: Number(row.totalRevenue) || 0,
      invoiceCount: row.invoiceCount || 0
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getStoreOrderBreakdown = async (req, res, next) => {
  try {
    const billing = await BillingRecord.findAll({
      attributes: [
        'store_id',
        [fn('SUM', col('amount')), 'billingRevenue'],
        [fn('COUNT', col('id')), 'invoiceCount']
      ],
      where: { tenantId: req.tenant.id },
      group: ['store_id', 'store.id', 'store.name'],
      include: [{ association: 'store', attributes: ['name'] }],
      order: [[fn('SUM', col('amount')), 'DESC']]
    });

    const transfers = await InventoryTransfer.findAll({
      attributes: [
        'to_store_id',
        [fn('SUM', col('quantity')), 'unitsReceived'],
        [fn('SUM', col('total_amount')), 'transferRevenue']
      ],
      where: { tenantId: req.tenant.id },
      group: ['to_store_id', 'destinationStore.id', 'destinationStore.name'],
      include: [{ association: 'destinationStore', attributes: ['name'] }]
    });

    const map = new Map();

    billing.forEach((row) => {
      const storeId = row.store_id;
      map.set(storeId, {
        storeId,
        storeName: row.store?.name || 'Unknown store',
        billingRevenue: Number(row.get('billingRevenue')) || 0,
        invoiceCount: Number(row.get('invoiceCount')) || 0,
        unitsReceived: 0,
        transferRevenue: 0
      });
    });

    transfers.forEach((row) => {
      const storeId = row.to_store_id;
      const entry = map.get(storeId) || {
        storeId,
        storeName: row.destinationStore?.name || 'Unknown store',
        billingRevenue: 0,
        invoiceCount: 0,
        unitsReceived: 0,
        transferRevenue: 0
      };
      entry.unitsReceived = Number(row.get('unitsReceived')) || 0;
      entry.transferRevenue = Number(row.get('transferRevenue')) || 0;
      map.set(storeId, entry);
    });

    res.json({ success: true, data: Array.from(map.values()) });
  } catch (err) { next(err); }
};

const getSalesPersonPerformance = async (req, res, next) => {
  try {
    const stats = await SalesPersonPerformanceSummary.findAll({
      where: { tenantId: req.tenant.id },
      include: [{ association: 'salesPerson', attributes: ['name', 'email'] }],
      order: [['totalAmount', 'DESC']]
    });

    const data = stats.map((record) => ({
      salesPersonId: record.salesPersonId,
      name: record.salesPerson?.name || 'Unknown',
      email: record.salesPerson?.email || null,
      totalUnits: record.totalUnits || 0,
      totalAmount: Number(record.totalAmount) || 0
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  getSalesStats,
  getTopViewedProducts,
  getBasicStats,
  getStateSalesStats,
  getTopSellingProducts,
  getStoreRevenueStats,
  getSalesPersonPerformance,
  getStoreOrderBreakdown
};
