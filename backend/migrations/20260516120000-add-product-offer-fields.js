'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'sale_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Optional discounted price for the tenant'
    });
    await queryInterface.addColumn('products', 'offer_label', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Label that explains why the product is on offer'
    });
    await queryInterface.addColumn('products', 'offer_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Expiry date for the offer price'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'offer_expires_at');
    await queryInterface.removeColumn('products', 'offer_label');
    await queryInterface.removeColumn('products', 'sale_price');
  }
};
