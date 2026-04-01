'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('delivery_regions', 'tax_rate', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'tax_rate'
    });
    await queryInterface.addColumn('delivery_regions', 'tax_label', {
      type: Sequelize.STRING,
      allowNull: true,
      field: 'tax_label'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('delivery_regions', 'tax_label');
    await queryInterface.removeColumn('delivery_regions', 'tax_rate');
  }
};
