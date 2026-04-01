'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('cart_recovery_tokens', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false },
      token: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: {
        type: Sequelize.ENUM('sent', 'claimed', 'expired'),
        allowNull: false,
        defaultValue: 'sent'
      },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('cart_recovery_tokens', ['tenant_id', 'user_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cart_recovery_tokens');
  }
};
