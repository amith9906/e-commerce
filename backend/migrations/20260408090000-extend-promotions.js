'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('promotions', 'banner_image', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('promotions', 'cta_text', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('promotions', 'cta_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('promotions', 'valid_from', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('promotions', 'valid_to', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('promotions', 'valid_to');
    await queryInterface.removeColumn('promotions', 'valid_from');
    await queryInterface.removeColumn('promotions', 'cta_url');
    await queryInterface.removeColumn('promotions', 'cta_text');
    await queryInterface.removeColumn('promotions', 'banner_image');
  },
};
