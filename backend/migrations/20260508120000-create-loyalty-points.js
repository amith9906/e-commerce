'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('loyalty_points', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onDelete: 'cascade',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'cascade',
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onDelete: 'set null',
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('earned', 'redeemed'),
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('loyalty_points', ['tenant_id']);
    await queryInterface.addIndex('loyalty_points', ['user_id']);
    await queryInterface.addIndex('loyalty_points', ['order_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('loyalty_points');
  }
};
