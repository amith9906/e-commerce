'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'age', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'age');
    await queryInterface.removeColumn('users', 'gender');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_gender;');
  },
};
