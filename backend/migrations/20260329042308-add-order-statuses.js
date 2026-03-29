'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ALTER TYPE cannot run inside a transaction block in Postgres
    await queryInterface.sequelize.query(`ALTER TYPE "enum_orders_status" ADD VALUE 'in_transit'`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_orders_status" ADD VALUE 'delayed'`);
  },

  async down(queryInterface, Sequelize) {
    // Postgres doesn't easily allow removing ENUM values.
    // For a simple rollback, we typically leave the type alone or drop the column and recreate it.
    // We'll leave this empty to prevent breaking existing data.
  }
};
