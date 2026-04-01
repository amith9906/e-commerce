'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add custom_domain to tenants
    await queryInterface.addColumn('tenants', 'custom_domain', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // 2. Subscriptions table
    await queryInterface.createTable('subscriptions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
      plan: { type: Sequelize.STRING, allowNull: false, defaultValue: 'free' },
      status: {
        type: Sequelize.ENUM('trialing', 'active', 'past_due', 'cancelled', 'expired'),
        defaultValue: 'active',
      },
      billing_cycle: { type: Sequelize.ENUM('monthly', 'yearly'), allowNull: true },
      current_period_start: { type: Sequelize.DATE, allowNull: true },
      current_period_end: { type: Sequelize.DATE, allowNull: true },
      trial_ends_at: { type: Sequelize.DATE, allowNull: true },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      stripe_customer_id: { type: Sequelize.STRING, allowNull: true },
      stripe_subscription_id: { type: Sequelize.STRING, allowNull: true },
      stripe_price_id: { type: Sequelize.STRING, allowNull: true },
      metadata: { type: Sequelize.JSONB, defaultValue: {} },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('subscriptions', ['tenant_id']);

    // 3. Audit logs table
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: true },
      user_id: { type: Sequelize.UUID, allowNull: true },
      user_email: { type: Sequelize.STRING, allowNull: true },
      user_role: { type: Sequelize.STRING, allowNull: true },
      action: { type: Sequelize.STRING, allowNull: false },
      entity: { type: Sequelize.STRING, allowNull: true },
      entity_id: { type: Sequelize.STRING, allowNull: true },
      method: { type: Sequelize.STRING, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: true },
      ip_address: { type: Sequelize.STRING, allowNull: true },
      user_agent: { type: Sequelize.STRING, allowNull: true },
      request_body: { type: Sequelize.JSONB, allowNull: true },
      response_status: { type: Sequelize.INTEGER, allowNull: true },
      metadata: { type: Sequelize.JSONB, defaultValue: {} },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('audit_logs', ['tenant_id']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);

    // 4. Tenant usage table
    await queryInterface.createTable('tenant_usage', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      store_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      user_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      orders_this_month: { type: Sequelize.INTEGER, defaultValue: 0 },
      api_calls_this_minute: { type: Sequelize.INTEGER, defaultValue: 0 },
      api_calls_last_reset: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      storage_mb: { type: Sequelize.FLOAT, defaultValue: 0 },
      last_order_month_reset: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tenant_usage');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('subscriptions');
    await queryInterface.removeColumn('tenants', 'custom_domain');
  },
};
