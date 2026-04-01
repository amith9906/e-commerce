'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('product_reviews');
    if (!table.images) {
      await queryInterface.addColumn('product_reviews', 'images', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('product_reviews');
    if (table.images) {
      await queryInterface.removeColumn('product_reviews', 'images');
    }
  },
};
