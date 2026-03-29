'use strict';
const { Store, StoreStock, Product } = require('../../models');

const resolveStore = async (tenantId, storeId) => {
  return Store.findOne({ where: { id: storeId, tenantId } });
};

// GET /api/stores/:storeId/stock
const listStoreStock = async (req, res, next) => {
  try {
    const store = await resolveStore(req.tenant.id, req.params.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const stock = await StoreStock.findAll({
      where: { storeId: store.id, tenantId: req.tenant.id },
      include: [{ association: 'product', attributes: ['name', 'sku', 'price'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: stock });
  } catch (err) {
    next(err);
  }
};

// POST /api/stores/:storeId/stock
const upsertStoreStock = async (req, res, next) => {
  try {
    const { productId, quantity, lowStockThreshold } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required.' });
    }
    const store = await resolveStore(req.tenant.id, req.params.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const product = await Product.findOne({ where: { id: productId, tenantId: req.tenant.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const [stock, created] = await StoreStock.findOrCreate({
      where: { storeId: store.id, productId, tenantId: req.tenant.id },
      defaults: {
        quantity: quantity || 0,
        lowStockThreshold: lowStockThreshold || 5,
        lastReceivedAt: quantity ? new Date() : null,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    });

    if (!created) {
      const updates = { updatedBy: req.user.id };
      if (quantity !== undefined) {
        updates.quantity = quantity;
        updates.lastReceivedAt = new Date();
      }
      if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;
      await stock.update(updates);
    }

    res.json({ success: true, data: stock });
  } catch (err) {
    next(err);
  }
};

const groupAvailability = (records) => {
  const map = {};
  records.forEach((record) => {
    const key = record.productId;
    if (!map[key]) {
      map[key] = { productId: key, totalQuantity: 0, stores: [] };
    }
    map[key].totalQuantity += record.quantity;
    if (record.store) {
      map[key].stores.push({
        id: record.store.id,
        name: record.store.name,
        contactPhone: record.store.contact_phone,
        quantity: record.quantity,
      });
    }
  });
  return map;
};

// GET /api/store-stock/product/:productId/availability
const getProductAvailability = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ where: { id: productId, tenantId: req.tenant.id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const stockEntries = await StoreStock.findAll({
      where: { productId, tenantId: req.tenant.id },
      include: [{ association: 'store', attributes: ['id', 'name', 'contact_phone'] }],
      order: [['quantity', 'DESC']]
    });

    const availability = groupAvailability(stockEntries)[productId] || { productId, totalQuantity: 0, stores: [] };
    res.json({ success: true, data: { product: { id: product.id, name: product.name }, ...availability } });
  } catch (err) {
    next(err);
  }
};

// GET /api/store-stock/products/availability
const getProductsAvailability = async (req, res, next) => {
  try {
    const { productIds } = req.query;
    if (!productIds) {
      return res.status(400).json({ success: false, message: 'productIds query parameter is required.' });
    }
    const ids = productIds.split(',').map((id) => id.trim()).filter(Boolean);
    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'No valid product IDs provided.' });
    }

    const stockEntries = await StoreStock.findAll({
      where: { productId: ids, tenantId: req.tenant.id },
      include: [{ association: 'store', attributes: ['id', 'name', 'contact_phone'] }],
      order: [['product_id', 'ASC'], ['quantity', 'DESC']]
    });

    const availability = groupAvailability(stockEntries);
    const response = Object.values(availability);
    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/stores/:storeId/stock/:productId
const deleteStoreStock = async (req, res, next) => {
  try {
    const store = await resolveStore(req.tenant.id, req.params.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const productId = req.params.productId;
    const destroyed = await StoreStock.destroy({
      where: { storeId: store.id, productId, tenantId: req.tenant.id }
    });
    if (!destroyed) return res.status(404).json({ success: false, message: 'Stock entry not found.' });

    res.json({ success: true, message: 'Stock removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listStoreStock,
  upsertStoreStock,
  deleteStoreStock,
  getProductAvailability,
  getProductsAvailability
};
