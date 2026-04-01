'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('back_in_stock_alerts', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: false },
      status: { 
        type: Sequelize.ENUM('pending', 'notified', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      notified_at: { type: Sequelize.DATE, allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addConstraint('back_in_stock_alerts', {
      fields: ['tenant_id', 'product_id', 'email'],
      type: 'unique',
      name: 'back_in_stock_alerts_unique_per_product_email'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('back_in_stock_alerts');
  }
};
