'use strict';
const { InvoiceTemplate } = require('../../models');
const { defaultTemplate } = require('../../utils/invoiceTemplate');

const getTemplate = async (req, res, next) => {
  try {
    let template = await InvoiceTemplate.findOne({ where: { tenantId: req.tenant.id } });
    if (!template) {
      template = await InvoiceTemplate.create({
        tenantId: req.tenant.id,
        name: 'Default Invoice',
        body: defaultTemplate,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
    }

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { name, body } = req.body;
    if (!body) {
      return res.status(400).json({ success: false, message: 'Template body is required.' });
    }

    const template = await InvoiceTemplate.findOne({ where: { tenantId: req.tenant.id } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    await template.update({
      name: name || template.name,
      body,
      updatedBy: req.user.id
    });

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplate, updateTemplate };
