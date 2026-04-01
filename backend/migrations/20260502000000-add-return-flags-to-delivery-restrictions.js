'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('delivery_restrictions', 'allow_return', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('delivery_restrictions', 'allow_replacement', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('delivery_restrictions', 'allow_return');
    await queryInterface.removeColumn('delivery_restrictions', 'allow_replacement');
  }
};
