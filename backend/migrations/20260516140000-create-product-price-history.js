'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_price_histories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      sale_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      offer_label: {
        type: Sequelize.STRING,
        allowNull: true
      },
      effective_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
    await queryInterface.addIndex('product_price_histories', ['tenant_id', 'product_id'], { name: 'product_price_histories_tenant_product_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_price_histories');
  }
};
