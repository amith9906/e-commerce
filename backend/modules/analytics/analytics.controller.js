'use strict';
const { ProductView, Order, OrderItem, Payment, User, Product, Stock, BillingRecord, InventoryTransfer, Store, StoreRevenueSummary, SalesPersonPerformanceSummary } = require('../../models');
const { fn, col, literal, Op } = require('sequelize');
const dayjs = require('dayjs');

const getTenantCurrency = (tenant) => tenant?.settings?.currency || 'INR';
const formatCurrencyForTenant = (value, tenant) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: getTenantCurrency(tenant) }).format(Number(value) || 0);

// GET /api/analytics/sales (Admin)
const getSalesStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilters = {};
    if (startDate && endDate) {
      dateFilters.created_at = { [Op.between]: [dayjs(startDate).startOf('day').toDate(), dayjs(endDate).endOf('day').toDate()] };
    } else if (startDate) {
      dateFilters.created_at = { [Op.gte]: dayjs(startDate).startOf('day').toDate() };
    } else if (endDate) {
      dateFilters.created_at = { [Op.lte]: dayjs(endDate).endOf('day').toDate() };
    }
    const stats = await Order.findAll({
      where: { tenantId: req.tenant.id, ...dateFilters },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalRevenue']
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'DESC']],
      limit: 30
    });
    const currency = getTenantCurrency(req.tenant);
    const data = stats.map((stat) => ({
      date: stat.get('date'),
      totalOrders: Number(stat.get('totalOrders')) || 0,
      totalRevenue: Number(stat.get('totalRevenue')) || 0,
      currency,
      formattedRevenue: formatCurrencyForTenant(stat.get('totalRevenue'), req.tenant)
    }));
    res.json({ success: true, data });
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
    const { startDate, endDate } = req.query;
    const dateFilters = {};
    if (startDate && endDate) {
      dateFilters.created_at = { [Op.between]: [dayjs(startDate).startOf('day').toDate(), dayjs(endDate).endOf('day').toDate()] };
    } else if (startDate) {
      dateFilters.created_at = { [Op.gte]: dayjs(startDate).startOf('day').toDate() };
    } else if (endDate) {
      dateFilters.created_at = { [Op.lte]: dayjs(endDate).endOf('day').toDate() };
    }
    const stats = await Order.findAll({
      where: { tenantId: req.tenant.id, ...dateFilters },
      attributes: [
        [literal(`COALESCE(NULLIF(TRIM(shipping_address_snapshot->>'state'), ''), 'Unknown')`), 'state'],
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalRevenue']
      ],
      group: [literal(`COALESCE(NULLIF(TRIM(shipping_address_snapshot->>'state'), ''), 'Unknown')`)],
      order: [[fn('SUM', col('total_amount')), 'DESC']],
      limit: 50
    });
    const currency = getTenantCurrency(req.tenant);
    const data = stats.map((stat) => ({
      state: stat.get('state'),
      totalOrders: Number(stat.get('totalOrders')) || 0,
      totalRevenue: Number(stat.get('totalRevenue')) || 0,
      currency,
      formattedRevenue: formatCurrencyForTenant(stat.get('totalRevenue'), req.tenant)
    }));
    res.json({ success: true, data });
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

    const currency = getTenantCurrency(req.tenant);
    const data = revenue.map((row) => ({
      storeId: row.storeId,
      storeName: row.store?.name || 'Unknown store',
      totalRevenue: Number(row.totalRevenue) || 0,
      formattedRevenue: formatCurrencyForTenant(row.totalRevenue, req.tenant),
      invoiceCount: row.invoiceCount || 0,
      currency
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

    const currency = getTenantCurrency(req.tenant);
    const map = new Map();

    billing.forEach((row) => {
      const storeId = row.store_id;
      map.set(storeId, {
        storeId,
        storeName: row.store?.name || 'Unknown store',
        billingRevenue: Number(row.get('billingRevenue')) || 0,
        formattedBillingRevenue: formatCurrencyForTenant(row.get('billingRevenue'), req.tenant),
        invoiceCount: Number(row.get('invoiceCount')) || 0,
        unitsReceived: 0,
        transferRevenue: 0,
        currency
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
      entry.formattedTransferRevenue = formatCurrencyForTenant(row.get('transferRevenue'), req.tenant);
      entry.currency = currency;
      map.set(storeId, entry);
    });

    res.json({ success: true, data: Array.from(map.values()) });
  } catch (err) { next(err); }
};

const getSalesPersonPerformance = async (req, res, next) => {
  try {
      const stats = await SalesPersonPerformanceSummary.findAll({
        where: { tenantId: req.tenant.id },
        attributes: ['sales_person_id', 'total_units', 'total_amount'],
        include: [{ association: 'salesPerson', attributes: ['name', 'email'] }],
        order: [[col('total_amount'), 'DESC']]
      });

    const currency = getTenantCurrency(req.tenant);
    const data = stats.map((record) => ({
      salesPersonId: record.salesPersonId,
      name: record.salesPerson?.name || 'Unknown',
      email: record.salesPerson?.email || null,
      totalUnits: record.totalUnits || 0,
      totalAmount: Number(record.totalAmount) || 0,
      formattedTotalAmount: formatCurrencyForTenant(record.totalAmount, req.tenant),
      currency
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getInventoryAlerts = async (req, res, next) => {
  try {
    const lowStockRecords = await Stock.findAll({
      where: { tenantId: req.tenant.id, quantity: { [Op.gte]: 0 } },
      include: [{ association: 'product', attributes: ['name', 'sku', 'images'] }]
    });

    const lowStock = lowStockRecords
      .filter((entry) => entry.quantity <= entry.lowStockThreshold)
      .map((entry) => ({
        id: entry.id,
        productId: entry.productId,
        productName: entry.product?.name || 'Unknown Product',
        sku: entry.product?.sku || '',
        quantity: entry.quantity,
        threshold: entry.lowStockThreshold,
        delta: entry.quantity - entry.lowStockThreshold,
        image: entry.product?.images?.[0] || null
      }));

    const delayHours = Number(req.query.delayHours) || 36;
    const delayedTransfers = await InventoryTransfer.findAll({
      where: {
        tenantId: req.tenant.id,
        status: { [Op.in]: ['pending', 'shipped'] },
        created_at: { [Op.lte]: dayjs().subtract(delayHours, 'hour').toDate() }
      },
      include: [
        { association: 'destinationStore', attributes: ['name'] },
        { association: 'salesPerson', attributes: ['id', 'name', 'email'] },
        { association: 'product', attributes: ['name', 'sku'] }
      ],
      order: [['created_at', 'ASC']],
      limit: 25
    });

    const currency = getTenantCurrency(req.tenant);
    const pending = delayedTransfers.map((transfer) => ({
      id: transfer.id,
      productName: transfer.product?.name || 'Unknown Product',
      sku: transfer.product?.sku || null,
      toStore: transfer.destinationStore?.name || 'Unknown Store',
      quantity: transfer.quantity,
      status: transfer.status,
      daysPending: Math.max(dayjs().diff(dayjs(transfer.created_at), 'day'), 0),
      createdAt: transfer.created_at,
      referenceInvoice: transfer.referenceInvoice,
      notes: transfer.notes,
      salesPerson: {
        id: transfer.salesPerson?.id,
        name: transfer.salesPerson?.name || 'Unknown',
        email: transfer.salesPerson?.email || null
      },
      totalAmount: Number(transfer.totalAmount) || 0,
      formattedAmount: formatCurrencyForTenant(transfer.totalAmount, req.tenant),
      currency
    }));

    res.json({ success: true, data: { currency, lowStock, delayedTransfers: pending } });
  } catch (err) {
    next(err);
  }
};

const exportCommissionCsv = async (req, res, next) => {
  try {
    const records = await SalesPersonPerformanceSummary.findAll({
      where: { tenantId: req.tenant.id },
      include: [{ association: 'salesPerson', attributes: ['name', 'email'] }],
      order: [[col('total_amount'), 'DESC']]
    });
    const currency = getTenantCurrency(req.tenant);
    const commissionRate = Number(req.tenant?.settings?.commissionRate) || 0.05;
    const header = ['Salesperson', 'Email', 'Units Sold', 'Revenue', 'Commission'];
    const rows = records.map((record) => {
      const revenue = Number(record.totalAmount) || 0;
      const commission = revenue * commissionRate;
      return [
        record.salesPerson?.name || 'Unknown',
        record.salesPerson?.email || '',
        record.totalUnits || 0,
        formatCurrencyForTenant(revenue, req.tenant),
        formatCurrencyForTenant(commission, req.tenant)
      ];
    });
    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="salesperson-commissions.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSalesStats,
  getTopViewedProducts,
  getBasicStats,
  getStateSalesStats,
  getTopSellingProducts,
  getStoreRevenueStats,
  getSalesPersonPerformance,
  getStoreOrderBreakdown,
  getInventoryAlerts,
  exportCommissionCsv
};
