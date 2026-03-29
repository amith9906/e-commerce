'use strict';
const { PickupRequest, StoreStock, Product, Store } = require('../../models');
const { Op } = require('sequelize');

const createPickupRequest = async (req, res, next) => {
  try {
    const { storeId, productId, quantity, scheduledFor, notes } = req.body;
    if (!storeId || !productId || !quantity || !scheduledFor) {
      return res.status(400).json({ success: false, message: 'storeId, productId, quantity, and scheduledFor are required.' });
    }

    const store = await Store.findOne({ where: { id: storeId, tenantId: req.tenant.id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const stock = await StoreStock.findOne({ where: { storeId: store.id, productId, tenantId: req.tenant.id } });
    if (!stock || stock.quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock for the requested store.' });
    }

    await stock.update({ quantity: stock.quantity - quantity, updatedBy: req.user.id });

    const pickup = await PickupRequest.create({
      tenantId: req.tenant.id,
      storeId: store.id,
      userId: req.user.id,
      productId,
      quantity,
      scheduledFor: new Date(scheduledFor),
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: pickup });
  } catch (err) {
    next(err);
  }
};

const listPickupRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;
    if (req.user.role === 'customer') where.userId = req.user.id;

    const pickups = await PickupRequest.findAll({
      where,
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'contact_phone'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }
      ],
      order: [['scheduled_for', 'ASC']]
    });
    res.json({ success: true, data: pickups });
  } catch (err) {
    next(err);
  }
};

const updatePickupStatus = async (req, res, next) => {
  try {
    const pickup = await PickupRequest.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup request not found.' });

    await pickup.update({
      status: req.body.status || pickup.status,
      updatedBy: req.user.id
    });

    res.json({ success: true, data: pickup });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPickupRequest, listPickupRequests, updatePickupStatus };
