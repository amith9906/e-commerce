'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('cart_items', ['tenant_id', 'user_id', 'updated_at'], {
      name: 'idx_cart_items_tenant_user_updated',
    });
    await queryInterface.addIndex('orders', ['tenant_id', 'status', 'created_at'], {
      name: 'idx_orders_tenant_status_created',
    });
    await queryInterface.addIndex('order_items', ['product_id', 'order_id'], {
      name: 'idx_order_items_product_order',
    });
    await queryInterface.addIndex('products', ['tenant_id', 'category', 'is_active'], {
      name: 'idx_products_tenant_category_active',
    });
    await queryInterface.addIndex('user_addresses', ['user_id', 'tenant_id'], {
      name: 'idx_user_addresses_user_tenant',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('cart_items', 'idx_cart_items_tenant_user_updated');
    await queryInterface.removeIndex('orders', 'idx_orders_tenant_status_created');
    await queryInterface.removeIndex('order_items', 'idx_order_items_product_order');
    await queryInterface.removeIndex('products', 'idx_products_tenant_category_active');
    await queryInterface.removeIndex('user_addresses', 'idx_user_addresses_user_tenant');
  }
};
