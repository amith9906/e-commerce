'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('notifications');
    if (table && !table.reference_id) {
      await queryInterface.addColumn('notifications', 'reference_id', {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'reference_id',
        comment: 'Optional reference to the related resource (e.g., ticket or order)'
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('notifications');
    if (table && table.reference_id) {
      await queryInterface.removeColumn('notifications', 'reference_id');
    }
  }
};
