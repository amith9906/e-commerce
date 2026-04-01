'use strict';
const { EventEmitter } = require('events');

const emitter = new EventEmitter();

const emitNotificationEvent = (notification) => {
  emitter.emit('newNotification', notification);
};

module.exports = { notificationEmitter: emitter, emitNotificationEvent };
