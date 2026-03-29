'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'specifications', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: true
    });
    await queryInterface.addColumn('products', 'highlights', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      defaultValue: [],
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'highlights');
    await queryInterface.removeColumn('products', 'specifications');
  }
};
