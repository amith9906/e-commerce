'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('products', ['tenant_id', 'is_active'], {
      name: 'products_tenant_active_idx'
    });

    await queryInterface.addIndex('orders', ['tenant_id', 'created_at'], {
      name: 'orders_tenant_created_idx'
    });

    await queryInterface.addIndex('inventory_transfers', ['tenant_id', 'sales_person_id'], {
      name: 'inventory_transfers_tenant_salesperson_idx'
    });

    await queryInterface.addIndex('billing_records', ['tenant_id', 'store_id'], {
      name: 'billing_records_tenant_store_idx'
    });

    await queryInterface.createTable('store_revenue_summaries', {
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      store_id: { type: Sequelize.UUID, allowNull: false },
      total_revenue: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      invoice_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addConstraint('store_revenue_summaries', {
      fields: ['tenant_id', 'store_id'],
      type: 'primary key',
      name: 'store_revenue_summaries_pk'
    });

    await queryInterface.addConstraint('store_revenue_summaries', {
      fields: ['store_id'],
      type: 'foreign key',
      name: 'store_revenue_summaries_store_fk',
      references: {
        table: 'stores',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('store_revenue_summaries', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'store_revenue_summaries_tenant_fk',
      references: {
        table: 'tenants',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.createTable('sales_person_performance_summaries', {
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      sales_person_id: { type: Sequelize.UUID, allowNull: false },
      total_units: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addConstraint('sales_person_performance_summaries', {
      fields: ['tenant_id', 'sales_person_id'],
      type: 'primary key',
      name: 'sales_person_performance_summaries_pk'
    });

    await queryInterface.addConstraint('sales_person_performance_summaries', {
      fields: ['sales_person_id'],
      type: 'foreign key',
      name: 'sales_person_performance_summaries_user_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('sales_person_performance_summaries', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'sales_person_performance_summaries_tenant_fk',
      references: {
        table: 'tenants',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint('store_revenue_summaries', 'store_revenue_summaries_store_fk');
    await queryInterface.removeConstraint('store_revenue_summaries', 'store_revenue_summaries_tenant_fk');
    await queryInterface.dropTable('store_revenue_summaries');

    await queryInterface.removeConstraint('sales_person_performance_summaries', 'sales_person_performance_summaries_user_fk');
    await queryInterface.removeConstraint('sales_person_performance_summaries', 'sales_person_performance_summaries_tenant_fk');
    await queryInterface.dropTable('sales_person_performance_summaries');

    await queryInterface.removeIndex('billing_records', 'billing_records_tenant_store_idx');
    await queryInterface.removeIndex('inventory_transfers', 'inventory_transfers_tenant_salesperson_idx');
    await queryInterface.removeIndex('orders', 'orders_tenant_created_idx');
    await queryInterface.removeIndex('products', 'products_tenant_active_idx');
  }
};
