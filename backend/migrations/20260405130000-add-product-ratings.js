'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'rating_avg', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Denormalized average rating'
    });
    await queryInterface.addColumn('products', 'rating_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of ratings received'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'rating_count');
    await queryInterface.removeColumn('products', 'rating_avg');
  }
};
