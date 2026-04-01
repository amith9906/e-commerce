'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pos_receipts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'stores', key: 'id' },
        onDelete: 'RESTRICT'
      },
      salesperson_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      currency: { type: Sequelize.STRING, allowNull: false, defaultValue: 'INR' },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      paid_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      payment_method: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('pos_receipt_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      pos_receipt_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pos_receipts', key: 'id' },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'RESTRICT'
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      tax_rate: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      line_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('pos_receipt_items');
    await queryInterface.dropTable('pos_receipts');
  }
};
