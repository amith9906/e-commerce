'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'slug', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addIndex('products', ['tenant_id', 'slug'], {
      name: 'products_tenant_slug_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('products', 'products_tenant_slug_idx');
    await queryInterface.removeColumn('products', 'slug');
  }
};
