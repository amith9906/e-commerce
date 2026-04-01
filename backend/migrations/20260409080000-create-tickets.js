'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tickets', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'), allowNull: false, defaultValue: 'open' },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('ticket_messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      ticket_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tickets', key: 'id' }, onDelete: 'CASCADE' },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
      sender_type: { type: Sequelize.ENUM('customer', 'admin'), allowNull: false },
      sender_id: { type: Sequelize.UUID, allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: false },
      attachments: { type: Sequelize.JSONB, defaultValue: [] },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ticket_messages');
    await queryInterface.dropTable('tickets');
  },
};
