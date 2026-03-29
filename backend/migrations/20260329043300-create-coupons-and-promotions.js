'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Coupons Table
    await queryInterface.createTable('coupons', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false },
      discount_type: { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      min_order_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      max_discount_amount: { type: Sequelize.DECIMAL(10, 2) },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      usage_limit: { type: Sequelize.INTEGER, defaultValue: 0 }, // 0 = unlimited
      usage_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_specific_user: { type: Sequelize.BOOLEAN, defaultValue: false },
      user_id: { type: Sequelize.UUID, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Create Promotions Table
    await queryInterface.createTable('promotions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      condition_type: { type: Sequelize.ENUM('min_order_amount'), defaultValue: 'min_order_amount' },
      condition_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      discount_type: { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Update Orders Table
    await queryInterface.addColumn('orders', 'coupon_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'coupons', key: 'id' }
    });
    await queryInterface.addColumn('orders', 'discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
    await queryInterface.addColumn('orders', 'shipping_fee', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'shipping_fee');
    await queryInterface.removeColumn('orders', 'discount_amount');
    await queryInterface.removeColumn('orders', 'coupon_id');
    await queryInterface.dropTable('promotions');
    await queryInterface.dropTable('coupons');
  }
};
