'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stores', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.JSONB, allowNull: true },
      contact_name: { type: Sequelize.STRING, allowNull: true },
      contact_phone: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive', 'suspended'), allowNull: false, defaultValue: 'active' },
      type: { type: Sequelize.ENUM('offline', 'online', 'warehouse'), allowNull: false, defaultValue: 'offline' },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('store_stock', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      store_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
      low_stock_threshold: { type: Sequelize.INTEGER, defaultValue: 5 },
      last_received_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('store_stock', {
      fields: ['store_id', 'product_id'],
      type: 'unique',
      name: 'store_stock_store_product_unique'
    });

    await queryInterface.createTable('inventory_transfers', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      from_store_id: { type: Sequelize.UUID, allowNull: true },
      to_store_id: { type: Sequelize.UUID, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      sales_person_id: { type: Sequelize.UUID, allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'shipped', 'delivered', 'cancelled'), defaultValue: 'pending' },
      reference_invoice: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('billing_records', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      store_id: { type: Sequelize.UUID, allowNull: false },
      transfer_id: { type: Sequelize.UUID, allowNull: true },
      invoice_number: { type: Sequelize.STRING, allowNull: false, unique: true },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      payment_status: { type: Sequelize.ENUM('pending', 'paid', 'partial'), defaultValue: 'pending' },
      payment_method: { type: Sequelize.ENUM('cash', 'bank', 'upi', 'credit'), defaultValue: 'cash' },
      due_date: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('salesperson_assignments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      store_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('salesperson_assignments', ['tenant_id', 'user_id'], { name: 'salesperson_assignments_tenant_user_idx' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('salesperson_assignments');
    await queryInterface.dropTable('billing_records');
    await queryInterface.dropTable('inventory_transfers');
    await queryInterface.dropTable('store_stock');
    await queryInterface.dropTable('stores');
  }
};
