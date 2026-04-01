'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_returns', 'customer_comment', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('order_returns', 'attachments', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('order_returns', 'attachments');
    await queryInterface.removeColumn('order_returns', 'customer_comment');
  },
};
