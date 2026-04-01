'use strict';
const { Supplier } = require('../../models');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const listSuppliers = async (req, res, next) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const where = { tenantId: req.tenant.id };
    if (req.query.status) where.status = req.query.status;
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });
    const paginationMeta = buildPaginationMeta(count, { page, limit });
    res.json({ success: true, data: rows, pagination: paginationMeta });
  } catch (err) {
    next(err);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      where: { id: req.params.supplierId, tenantId: req.tenant.id }
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, email, phone, contactName, address, notes, status } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }
    const supplier = await Supplier.create({
      tenantId: req.tenant.id,
      name,
      email,
      phone,
      contactName,
      address,
      notes,
      status,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      where: { id: req.params.supplierId, tenantId: req.tenant.id }
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }
    const updates = {};
    ['name', 'email', 'phone', 'contactName', 'address', 'notes', 'status'].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    updates.updatedBy = req.user.id;
    await supplier.update(updates);
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier
};
