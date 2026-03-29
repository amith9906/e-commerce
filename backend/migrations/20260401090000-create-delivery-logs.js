'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('delivery_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      transfer_id: { type: Sequelize.UUID, allowNull: false },
      sales_person_id: { type: Sequelize.UUID, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'delivered' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      location: { type: Sequelize.STRING, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('delivery_logs', ['tenant_id', 'sales_person_id'], { name: 'delivery_logs_tenant_salesperson_idx' });
    await queryInterface.addIndex('delivery_logs', ['transfer_id'], { name: 'delivery_logs_transfer_idx' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('delivery_logs');
  }
};
