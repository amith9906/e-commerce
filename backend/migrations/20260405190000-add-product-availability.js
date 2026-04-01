'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'available_sizes', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'List of available sizes for the product'
    });
    await queryInterface.addColumn('products', 'available_colors', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'List of available colors for the product'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'available_colors');
    await queryInterface.removeColumn('products', 'available_sizes');
  }
};
