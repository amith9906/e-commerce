'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('payments').catch(() => null);
    if (table && !table.gateway_id) {
      await queryInterface.addColumn('payments', 'gateway_id', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('payments').catch(() => null);
    if (table && table.gateway_id) {
      await queryInterface.removeColumn('payments', 'gateway_id');
    }
  }
};
