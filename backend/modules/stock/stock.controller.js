'use strict';
const { Stock, Product } = require('../../models');

// GET /api/stock (Admin)
const getStock = async (req, res, next) => {
  try {
    const stock = await Stock.findAll({
      where: { tenantId: req.tenant.id },
    include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'category', 'images', 'isActive'] }],
      order: [['quantity', 'ASC']], // low stock first
    });
    res.json({ success: true, data: stock });
  } catch (err) { next(err); }
};

// PUT /api/stock/:productId (Admin)
const updateStock = async (req, res, next) => {
  try {
    const { quantity, lowStockThreshold } = req.body;
    let stock = await Stock.findOne({ where: { productId: req.params.productId, tenantId: req.tenant.id } });
    
    if (!stock) {
      // Create if doesn't exist for some reason
      stock = await Stock.create({
        productId: req.params.productId,
        tenantId: req.tenant.id,
        quantity: quantity || 0,
        lowStockThreshold: lowStockThreshold || 5,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
    } else {
      const updates = { updatedBy: req.user.id };
      if (quantity !== undefined) updates.quantity = quantity;
      if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;
      await stock.update(updates);
    }

    res.json({ success: true, data: stock });
  } catch (err) { next(err); }
};

module.exports = { getStock, updateStock };
