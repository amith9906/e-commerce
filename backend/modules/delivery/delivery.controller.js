'use strict';
const { DeliveryRegion, DeliveryRestriction, Product } = require('../../models');
const { Op } = require('sequelize');
const { findRegionForAddress, buildRestrictionMap, getRestrictionForProduct } = require('../../utils/deliveryHelper');
const { sanitizeRate } = require('../../utils/tax');
const slugify = require('slugify');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const getRegions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePaginationParams(req.query);
    const includeRestrictions = req.query.includeRestrictions === 'true';
    const include = includeRestrictions
      ? [{ model: DeliveryRestriction, as: 'restrictions', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }] }]
      : [];
    const where = { tenantId: req.tenant.id };
    if (req.query.search) {
      where.name = { [Op.iLike]: `%${req.query.search}%` };
    }
    if (req.query.status === 'active') where.isActive = true;
    else if (req.query.status === 'inactive') where.isActive = false;

    const { count, rows } = await DeliveryRegion.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: buildPaginationMeta(count, { page, limit })
    });
  } catch (err) {
    next(err);
  }
};

const createRegion = async (req, res, next) => {
  try {
    const { name, slug, notes, leadTimeDays, locations, isActive, taxRate, taxLabel } = req.body;
    const normalizedSlug = slug || slugify(name, { lower: true, strict: true });
    const regionTaxRate = sanitizeRate(taxRate);
    const regionTaxLabel = taxLabel ? String(taxLabel).trim() : null;
    const region = await DeliveryRegion.create({
      tenantId: req.tenant.id,
      name,
      slug: normalizedSlug,
      notes,
      leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : null,
      locations: Array.isArray(locations) ? locations : [],
      taxRate: regionTaxRate,
      taxLabel: regionTaxLabel,
      isActive: isActive === undefined ? true : isActive,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ success: true, data: region });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Region slug already exists.' });
    }
    next(err);
  }
};

const updateRegion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const region = await DeliveryRegion.findOne({ where: { id, tenantId: req.tenant.id } });
    if (!region) return res.status(404).json({ success: false, message: 'Region not found.' });

    const { name, slug, notes, leadTimeDays, locations, isActive, taxRate, taxLabel } = req.body;
    const updates = {
      name: name || region.name,
      slug: slug || slugify(name || region.name, { lower: true, strict: true }),
      notes: notes !== undefined ? notes : region.notes,
      leadTimeDays: leadTimeDays !== undefined ? parseInt(leadTimeDays, 10) : region.leadTimeDays,
      locations: Array.isArray(locations) ? locations : region.locations,
      taxRate: taxRate !== undefined ? sanitizeRate(taxRate) : region.taxRate,
      taxLabel: taxLabel !== undefined ? (taxLabel ? String(taxLabel).trim() : null) : region.taxLabel,
      isActive: isActive === undefined ? region.isActive : isActive,
      updatedBy: req.user.id
    };

    await region.update(updates);
    res.json({ success: true, data: region });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Region slug already exists.' });
    }
    next(err);
  }
};

const deleteRegion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const region = await DeliveryRegion.findOne({ where: { id, tenantId: req.tenant.id } });
    if (!region) return res.status(404).json({ success: false, message: 'Region not found.' });
    await region.destroy();
    res.json({ success: true, message: 'Region deleted.' });
  } catch (err) {
    next(err);
  }
};

const getRestrictions = async (req, res, next) => {
  try {
    const where = { tenantId: req.tenant.id };
    if (req.query.regionId) where.regionId = req.query.regionId;
    if (req.query.productId) where.productId = req.query.productId;

    const restrictions = await DeliveryRestriction.findAll({
      where,
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: restrictions });
  } catch (err) {
    next(err);
  }
};

const upsertRestriction = async (req, res, next) => {
  try {
    const { regionId, productId, category, isAllowed, minOrderValue, maxWeightKg, allowReturn, allowReplacement, notes } = req.body;
    const [restriction] = await DeliveryRestriction.findOrCreate({
      where: {
        tenantId: req.tenant.id,
        regionId,
        productId: productId || null,
        category: category || null
      },
      defaults: {
        isAllowed: isAllowed !== undefined ? isAllowed : true,
        minOrderValue,
        maxWeightKg,
        allowReturn: allowReturn !== undefined ? allowReturn : true,
        allowReplacement: allowReplacement !== undefined ? allowReplacement : true,
        notes,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    });

    if (!restriction.isNewRecord) {
      await restriction.update({
        isAllowed: isAllowed !== undefined ? isAllowed : restriction.isAllowed,
        minOrderValue,
        maxWeightKg,
        allowReturn: allowReturn !== undefined ? allowReturn : restriction.allowReturn,
        allowReplacement: allowReplacement !== undefined ? allowReplacement : restriction.allowReplacement,
        notes,
        updatedBy: req.user.id
      });
    }

    res.json({ success: true, data: restriction });
  } catch (err) {
    next(err);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const { productId, country, state, city, postalCode } = req.query;
    const address = { country, state, city, postalCode };
    const regions = await DeliveryRegion.findAll({
      where: { tenantId: req.tenant.id, isActive: true },
      order: [['lead_time_days', 'ASC']]
    });

    const matchedRegion = findRegionForAddress(address, regions);
    const product = productId ? await Product.findOne({ where: { id: productId, tenantId: req.tenant.id } }) : null;

    let restrictionData = null;
    let isDeliverable = !!matchedRegion;
    if (matchedRegion) {
      const restrictions = await DeliveryRestriction.findAll({
        where: { tenantId: req.tenant.id, regionId: matchedRegion.id }
      });
      const map = buildRestrictionMap(restrictions);
      const restriction = product ? getRestrictionForProduct(map, product.id, product.category) : null;
      restrictionData = restriction;
      if (restriction && !restriction.isAllowed) {
        isDeliverable = false;
      }
    }

    res.json({
      success: true,
      data: {
        deliverableRegions: regions.map((region) => ({
          id: region.id,
          name: region.name,
          leadTimeDays: region.leadTimeDays,
          isActive: region.isActive,
        })),
        matchedRegion: matchedRegion
          ? {
              id: matchedRegion.id,
              name: matchedRegion.name,
              leadTimeDays: matchedRegion.leadTimeDays,
              locations: matchedRegion.locations
            }
          : null,
        isDeliverable,
        restriction: restrictionData,
        product: product ? { id: product.id, name: product.name, category: product.category } : null
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  getRestrictions,
  upsertRestriction,
  checkAvailability
};
