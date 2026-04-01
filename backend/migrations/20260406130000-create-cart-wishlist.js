'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cart_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      size: { type: Sequelize.STRING, allowNull: true },
      color: { type: Sequelize.STRING, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('wishlist_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('wishlist_items');
    await queryInterface.dropTable('cart_items');
  }
};
