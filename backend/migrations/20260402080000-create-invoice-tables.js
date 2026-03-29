'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_templates', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Default Invoice' },
      body: { type: Sequelize.TEXT, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('order_invoices', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      order_id: { type: Sequelize.UUID, allowNull: false },
      template_id: { type: Sequelize.UUID, allowNull: true },
      invoice_number: { type: Sequelize.STRING, allowNull: false, unique: true },
      content: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('generated', 'sent'), allowNull: false, defaultValue: 'generated' },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('order_invoices', {
      fields: ['order_id'],
      type: 'unique',
      name: 'order_invoices_order_unique'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('order_invoices');
    await queryInterface.dropTable('invoice_templates');
  }
};
