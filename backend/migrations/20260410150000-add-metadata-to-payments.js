'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('payments').catch(() => null);
    if (table && !table.metadata) {
      await queryInterface.addColumn('payments', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('payments').catch(() => null);
    if (table && table.metadata) {
      await queryInterface.removeColumn('payments', 'metadata');
    }
  }
};
