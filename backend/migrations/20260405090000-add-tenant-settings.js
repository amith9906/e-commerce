'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tenants', 'settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Tenant-specific configuration overrides'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('tenants', 'settings');
  }
};
