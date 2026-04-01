'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('payments').catch(() => null);
    if (table) {
      if (!table.refund_id) {
        await queryInterface.addColumn('payments', 'refund_id', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('payments').catch(() => null);
    if (table && table.refund_id) {
      await queryInterface.removeColumn('payments', 'refund_id');
    }
  }
};
