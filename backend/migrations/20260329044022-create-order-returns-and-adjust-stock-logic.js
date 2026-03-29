'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_returns', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' } },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
      type: { type: Sequelize.ENUM('return', 'replacement'), defaultValue: 'return' },
      reason: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected', 'completed'), defaultValue: 'pending' },
      admin_notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID }
    });

    // Add unique index for SKU per tenant for better stock management
    await queryInterface.addIndex('products', ['tenant_id', 'sku'], {
      unique: true,
      name: 'products_tenant_sku_unique',
      where: { sku: { [Sequelize.Op.ne]: null } }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('products', 'products_tenant_sku_unique');
    await queryInterface.dropTable('order_returns');
  }
};
