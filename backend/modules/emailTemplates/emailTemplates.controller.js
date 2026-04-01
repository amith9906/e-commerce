'use strict';
const { EmailTemplate } = require('../../models');

const listTemplates = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.findAll({ where: { tenantId: req.tenant.id }, order: [['template_type', 'ASC']] });
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
};

const getTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { tenantId: req.tenant.id, templateType: req.params.templateType }
    });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { templateType, name, subject, body, placeholders = [] } = req.body;
    if (!templateType || !name || !subject || !body) {
      return res.status(400).json({ success: false, message: 'templateType, name, subject, and body are required.' });
    }
    const [template, created] = await EmailTemplate.findOrCreate({
      where: { tenantId: req.tenant.id, templateType },
      defaults: {
        tenantId: req.tenant.id,
        name,
        subject,
        body,
        placeholders,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      }
    });
    if (!created) {
      return res.status(409).json({ success: false, message: 'Template already exists. Use PATCH to update.' });
    }
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { tenantId: req.tenant.id, templateType: req.params.templateType }
    });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });

    const updates = {};
    ['name', 'subject', 'body', 'status'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (Array.isArray(req.body.placeholders)) updates.placeholders = req.body.placeholders;
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'No updates provided.' });

    updates.updatedBy = req.user.id;
    await template.update(updates);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const deleted = await EmailTemplate.destroy({
      where: { tenantId: req.tenant.id, templateType: req.params.templateType }
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Template not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
