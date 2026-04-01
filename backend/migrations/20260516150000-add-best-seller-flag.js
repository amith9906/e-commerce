'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'is_best_seller', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Marks products recommended as best sellers'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'is_best_seller');
  }
};
