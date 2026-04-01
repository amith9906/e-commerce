'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'tax_rate', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'tax_rate'
    });
    await queryInterface.addColumn('orders', 'tax_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'tax_amount'
    });
    await queryInterface.addColumn('orders', 'tax_label', {
      type: Sequelize.STRING,
      allowNull: true,
      field: 'tax_label'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'tax_label');
    await queryInterface.removeColumn('orders', 'tax_amount');
    await queryInterface.removeColumn('orders', 'tax_rate');
  }
};
