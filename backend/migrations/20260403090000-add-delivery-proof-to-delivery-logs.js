'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('delivery_logs', 'latitude', { type: Sequelize.DECIMAL(11, 8), allowNull: true });
    await queryInterface.addColumn('delivery_logs', 'longitude', { type: Sequelize.DECIMAL(11, 8), allowNull: true });
    await queryInterface.addColumn('delivery_logs', 'proof_url', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('delivery_logs', 'signature_url', { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('delivery_logs', 'signature_url');
    await queryInterface.removeColumn('delivery_logs', 'proof_url');
    await queryInterface.removeColumn('delivery_logs', 'longitude');
    await queryInterface.removeColumn('delivery_logs', 'latitude');
  }
};
