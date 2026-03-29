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

module.exports = { listStoreStock, upsertStoreStock, deleteStoreStock };
