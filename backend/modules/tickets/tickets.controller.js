'use strict';
const { Ticket, TicketMessage, User, Notification } = require('../../models');
const { Op } = require('sequelize');
const { uploadToS3 } = require('../../utils/s3Upload');
const { emitNotificationEvent } = require('../../utils/notificationEmitter');
const { parsePaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const notifyAdmins = async ({ tenantId, ticket, actor, messageBody }) => {
  try {
    const admins = await User.findAll({
      where: {
        tenantId,
        role: { [Op.in]: ['admin', 'store_manager'] },
        isActive: true
      }
    });

    const notifications = admins.map((admin) => ({
      tenantId,
      userId: admin.id,
      title: `New support ticket #${ticket.id.slice(0, 8)}`,
      message: `${actor.name || actor.email} created a ticket: ${ticket.title}. ${messageBody ? `Message: ${messageBody}` : ''}`,
      type: 'info',
      referenceId: ticket.id,
      createdBy: actor.id,
      updatedBy: actor.id
    }));

    const created = await Notification.bulkCreate(notifications, { returning: true });
    created.forEach((note) => emitNotificationEvent(note.toJSON ? note.toJSON() : note));
  } catch (err) {
    console.error('Failed to notify admins', err);
  }
};

const notifyCustomer = async ({ tenantId, ticket, actor, messageBody }) => {
  try {
    const notification = {
      tenantId,
      userId: ticket.userId,
      title: `Update on ticket #${ticket.id.slice(0, 8)}`,
      message: `${actor.name || actor.email} responded: ${messageBody}`,
      type: 'info',
      referenceId: ticket.id,
      createdBy: actor.id,
      updatedBy: actor.id
    };

    const created = await Notification.create(notification);
    emitNotificationEvent(created.toJSON ? created.toJSON() : created);
  } catch (err) {
    console.error('Failed to notify customer', err);
  }
};

  const createTicket = async (req, res, next) => {
    try {
      const { title, body, priority = 'medium' } = req.body;
    const ticket = await Ticket.create({
      tenantId: req.tenant.id,
      userId: req.user.id,
      title,
      priority,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await TicketMessage.create({
      ticketId: ticket.id,
      tenantId: req.tenant.id,
      senderType: 'customer',
      senderId: req.user.id,
      body,
    });

    await notifyAdmins({
      tenantId: req.tenant.id,
      ticket,
      actor: req.user,
      messageBody: body
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

const listTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const where = {
      tenantId: req.tenant.id,
      userId: req.user.id,
    };
    if (status) where.status = status;

    const { count, rows } = await Ticket.findAndCountAll({
      where,
      include: [{ model: TicketMessage, as: 'messages', limit: 3, order: [['created_at', 'DESC']] }],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: buildPaginationMeta(count, { page, limit }) });
  } catch (err) { next(err); }
};

const viewTicket = async (req, res, next) => {
  try {
    const where = { id: req.params.id, tenantId: req.tenant.id };
    if (req.user.role === 'customer') {
      where.userId = req.user.id;
    }
    const ticket = await Ticket.findOne({
      where,
      include: [{ model: TicketMessage, as: 'messages', order: [['created_at', 'ASC']] }],
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

const adminListTickets = async (req, res, next) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { page, limit, offset } = pagination;
    const where = { tenantId: req.tenant.id };
    const { count, rows } = await Ticket.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'role'],
      },
      {
        model: TicketMessage,
        as: 'messages',
        order: [['created_at', 'DESC']],
        limit: 1,
      }],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: buildPaginationMeta(count, { page, limit }) });
  } catch (err) { next(err); }
};

const addMessage = async (req, res, next) => {
  try {
    const { body, senderType } = req.body;
    const ticket = await Ticket.findOne({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    if (senderType === 'admin') {
      await ticket.update({ status: req.body.status || ticket.status, updatedBy: req.user.id });
    }

    const message = await TicketMessage.create({
      ticketId: ticket.id,
      tenantId: req.tenant.id,
      senderType,
      senderId: req.user.id,
      body,
    });

    if (senderType === 'customer') {
      notifyAdmins({
        tenantId: req.tenant.id,
        ticket,
        actor: req.user,
        messageBody: body
      });
    } else if (senderType === 'admin') {
      notifyCustomer({
        tenantId: req.tenant.id,
        ticket,
        actor: req.user,
        messageBody: body
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
};

module.exports = { createTicket, listTickets, viewTicket, adminListTickets, addMessage };
