'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'brand', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('products', 'color', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('products', 'size', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('products', 'sku', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'sku');
    await queryInterface.removeColumn('products', 'size');
    await queryInterface.removeColumn('products', 'color');
    await queryInterface.removeColumn('products', 'brand');
  }
};
