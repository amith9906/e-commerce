'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tenantTable = await queryInterface.describeTable('tenants').catch(() => null);
    if (tenantTable && !tenantTable.settings) {
      await queryInterface.addColumn('tenants', 'settings', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Tenant-specific configuration overrides'
      });
    }

    const paymentsTable = await queryInterface.describeTable('payments').catch(() => null);
    if (paymentsTable) {
      if (!paymentsTable.metadata) {
        await queryInterface.addColumn('payments', 'metadata', {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {}
        });
      }
      if (!paymentsTable.gateway_id) {
        await queryInterface.addColumn('payments', 'gateway_id', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      if (!paymentsTable.refund_id) {
        await queryInterface.addColumn('payments', 'refund_id', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const paymentsTable = await queryInterface.describeTable('payments').catch(() => null);
    if (paymentsTable) {
      if (paymentsTable.refund_id) {
        await queryInterface.removeColumn('payments', 'refund_id');
      }
      if (paymentsTable.gateway_id) {
        await queryInterface.removeColumn('payments', 'gateway_id');
      }
      if (paymentsTable.metadata) {
        await queryInterface.removeColumn('payments', 'metadata');
      }
    }

    const tenantTable = await queryInterface.describeTable('tenants').catch(() => null);
    if (tenantTable && tenantTable.settings) {
      await queryInterface.removeColumn('tenants', 'settings');
    }
  }
};
