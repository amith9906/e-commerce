'use strict';
const { ContactMessage } = require('../../models');

const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const actorId = req.user?.id || null;
    
    const contact = await ContactMessage.create({
      tenantId: req.tenant.id,
      name,
      email,
      subject,
      message,
      status: 'new',
      createdBy: actorId,
      updatedBy: actorId
    });

    res.status(201).json({ success: true, message: 'Message received. We will get back to you soon.' });
  } catch (err) { next(err); }
};

const getInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenantId: req.tenant.id };
    if (status) where.status = status;

    const { count, rows } = await ContactMessage.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data: rows, pagination: { total: count, page, pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

const updateInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const inquiry = await ContactMessage.findOne({ where: { id, tenantId: req.tenant.id } });
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });

    await inquiry.update({ status, adminNotes, updatedBy: req.user.id });
    res.json({ success: true, message: 'Inquiry status updated.' });
  } catch (err) { next(err); }
};

const listOwnMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const { count, rows } = await ContactMessage.findAndCountAll({
      where: { tenantId: req.tenant.id, createdBy: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page, 10), pages: Math.ceil(count / limit) },
    });
  } catch (err) { next(err); }
};

module.exports = { submitContact, getInquiries, updateInquiryStatus, listOwnMessages };
