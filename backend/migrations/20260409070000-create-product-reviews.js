'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_reviews', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      images: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      is_verified_purchase: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('product_reviews', {
      fields: ['tenant_id', 'product_id', 'user_id'],
      type: 'unique',
      name: 'product_reviews_tenant_product_user_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('product_reviews');
  },
};
