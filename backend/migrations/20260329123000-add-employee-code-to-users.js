'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'employee_code', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Optional employee identifier for sales/store staff'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'employee_code');
  }
};
