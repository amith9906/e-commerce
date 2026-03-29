'use strict';
const { Store, StoreStock, BillingRecord, SalesPersonAssignment, User } = require('../../models');

// POST /api/stores
const createStore = async (req, res, next) => {
  try {
    const { name, address, contactName, contactPhone, type, status } = req.body;

    const store = await Store.create({
      tenantId: req.tenant.id,
      name,
      address,
      contactName,
      contactPhone,
      type: type || 'offline',
      status: status || 'active',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

// GET /api/stores
const listStores = async (req, res, next) => {
  try {
    const stores = await Store.findAll({
      where: { tenantId: req.tenant.id },
      include: [
        { association: 'stock', attributes: ['product_id', 'quantity'], required: false },
        { association: 'billingRecords', attributes: ['invoice_number', 'amount', 'payment_status'], required: false }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: stores });
  } catch (err) {
    next(err);
  }
};

// GET /api/stores/:storeId
const getStoreDetails = async (req, res, next) => {
  try {
    const store = await Store.findOne({
      where: { id: req.params.storeId, tenantId: req.tenant.id },
      include: [
        { association: 'stock', include: [{ association: 'product', attributes: ['name', 'sku'] }] },
        { association: 'billingRecords' },
        {
          association: 'assignments',
          include: [{ association: 'salesPerson', attributes: ['id', 'name', 'email', 'role'] }]
        }
      ]
    });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/stores/:storeId
const updateStore = async (req, res, next) => {
  try {
    const { name, address, contactName, contactPhone, status } = req.body;
    const store = await Store.findOne({ where: { id: req.params.storeId, tenantId: req.tenant.id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const updates = { updatedBy: req.user.id };
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (contactName !== undefined) updates.contactName = contactName;
    if (contactPhone !== undefined) updates.contactPhone = contactPhone;
    if (status !== undefined) updates.status = status;

    await store.update(updates);
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

// POST /api/stores/:storeId/assign
const assignSalesPerson = async (req, res, next) => {
  try {
    const { salesPersonId } = req.body;
    const store = await Store.findOne({ where: { id: req.params.storeId, tenantId: req.tenant.id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const salesPerson = await User.findOne({ where: { id: salesPersonId, tenantId: req.tenant.id, role: 'salesperson' } });
    if (!salesPerson) return res.status(400).json({ success: false, message: 'Invalid sales person.' });

    const assignment = await SalesPersonAssignment.create({
      tenantId: req.tenant.id,
      storeId: store.id,
      userId: salesPerson.id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

module.exports = { createStore, listStores, getStoreDetails, updateStore, assignSalesPerson };
