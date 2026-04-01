'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suppliers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      contact_name: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.JSONB, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('purchase_orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'suppliers', key: 'id' },
        onDelete: 'RESTRICT'
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'stores', key: 'id' },
        onDelete: 'SET NULL'
      },
      order_number: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('draft', 'ordered', 'partial', 'received', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      currency: { type: Sequelize.STRING, allowNull: false, defaultValue: 'INR' },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      expected_delivery_date: { type: Sequelize.DATE, allowNull: true },
      received_date: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('purchase_orders', {
      fields: ['tenant_id', 'order_number'],
      type: 'unique',
      name: 'purchase_orders_tenant_order_number_unique'
    });

    await queryInterface.createTable('purchase_order_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      purchase_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'purchase_orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'RESTRICT'
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      received_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      tax_rate: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      line_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('purchase_order_items');
    await queryInterface.removeConstraint('purchase_orders', 'purchase_orders_tenant_order_number_unique');
    await queryInterface.dropTable('purchase_orders');
    await queryInterface.dropTable('suppliers');
  }
};
