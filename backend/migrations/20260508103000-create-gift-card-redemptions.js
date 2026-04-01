'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gift_card_redemptions', {
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
      gift_card_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'gift_cards',
          key: 'id'
        },
        onDelete: 'cascade',
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      note: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('gift_card_redemptions', ['tenant_id']);
    await queryInterface.addIndex('gift_card_redemptions', ['gift_card_id']);
    await queryInterface.addIndex('gift_card_redemptions', ['order_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gift_card_redemptions');
  }
};
