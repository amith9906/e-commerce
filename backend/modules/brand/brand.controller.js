'use strict';
const { BrandConfig } = require('../../models');
const { uploadToS3 } = require('../../utils/s3Upload');

// GET /api/brand
// Public/Customer: Fetch brand settings for the resolved tenant
const getBrandConfig = async (req, res, next) => {
  try {
    const configs = await BrandConfig.findAll({ where: { tenantId: req.tenant.id } });
    
    // Convert array of {key, value} to an object
    const brand = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    const tenantCurrency = req.tenant?.settings?.currency || 'INR';
    if (!brand.currency) {
      brand.currency = tenantCurrency;
    }
    const tenantSettings = req.tenant?.settings || {};
    brand.settings = tenantSettings;
    if (!brand.currency) {
      brand.currency = tenantSettings.currency || 'INR';
    }
    brand.supportContacts = tenantSettings.supportContacts || brand.supportContacts || {
      email: `support@${req.tenant?.slug || 'brand'}.com`,
      phone: '+91 0000000000'
    };
    const defaultSocialLinks = {
      facebookUrl: '',
      instagramUrl: '',
      youtubeUrl: '',
      showFacebook: false,
      showInstagram: false,
      showYoutube: false,
    };
    const parseSocialLinks = (value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object' ? parsed : null;
        } catch {
          return null;
        }
      }
      if (typeof value === 'object') return value;
      return null;
    };
    const storedSocial = parseSocialLinks(brand.socialLinks) || {};
    const tenantSocial = parseSocialLinks(tenantSettings.socialLinks) || {};
    brand.socialLinks = {
      ...defaultSocialLinks,
      ...storedSocial,
      ...tenantSocial
    };

    res.json({ success: true, data: brand });
  } catch (err) { next(err); }
};

// PUT /api/brand
// Admin: Update multiple brand config keys at once
const updateBrandConfig = async (req, res, next) => {
  try {
    const updates = req.body; // e.g. { primaryColor: '#ff0000', storeName: 'My Store' }
    
    // Process logo upload if present
    if (req.file) {
      const logoUrl = await uploadToS3(req.file.buffer, req.file.mimetype, 'brands');
      updates.logoUrl = logoUrl;
    }

    const keys = Object.keys(updates);
    
    // In a transaction
    const sequelize = require('../../config/database');
    await sequelize.transaction(async (t) => {
      for (const key of keys) {
        let config = await BrandConfig.findOne({ where: { key, tenantId: req.tenant.id }, transaction: t });
        if (config) {
          await config.update({ value: updates[key], updatedBy: req.user.id }, { transaction: t });
        } else {
          await BrandConfig.create({
            tenantId: req.tenant.id,
            key,
            value: updates[key],
            createdBy: req.user.id,
            updatedBy: req.user.id
          }, { transaction: t });
        }
      }
    });

    res.json({ success: true, message: 'Brand configuration updated.' });
  } catch (err) { next(err); }
};

module.exports = { getBrandConfig, updateBrandConfig };
