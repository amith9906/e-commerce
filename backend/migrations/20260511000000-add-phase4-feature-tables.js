'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tenant_webhooks', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      url: { type: Sequelize.TEXT, allowNull: false },
      events: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      secret: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.ENUM('enabled', 'disabled'), allowNull: false, defaultValue: 'enabled' },
      last_status: { type: Sequelize.STRING, allowNull: true },
      last_attempted_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('webhook_deliveries', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_webhook_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenant_webhooks', key: 'id' },
        onDelete: 'CASCADE'
      },
      event: { type: Sequelize.STRING, allowNull: false },
      payload: { type: Sequelize.JSONB, allowNull: true },
      status: { type: Sequelize.ENUM('success', 'failure'), allowNull: false },
      response_code: { type: Sequelize.INTEGER, allowNull: true },
      response_body: { type: Sequelize.TEXT, allowNull: true },
      attempted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('tenant_api_keys', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      label: { type: Sequelize.STRING, allowNull: false },
      key_id: { type: Sequelize.STRING, allowNull: false },
      secret_hash: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM('active', 'revoked'), allowNull: false, defaultValue: 'active' },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      last_used_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('tenant_api_keys', {
      fields: ['tenant_id', 'key_id'],
      type: 'unique',
      name: 'tenant_api_keys_tenant_keyid_unique'
    });

    await queryInterface.createTable('tenant_email_templates', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      template_type: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      subject: { type: Sequelize.STRING, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      placeholders: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      status: { type: Sequelize.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('tenant_email_templates', {
      fields: ['tenant_id', 'template_type'],
      type: 'unique',
      name: 'tenant_email_templates_tenant_type_unique'
    });

    await queryInterface.createTable('tenant_sso_settings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      provider: { type: Sequelize.STRING, allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      client_id: { type: Sequelize.STRING, allowNull: false },
      client_secret: { type: Sequelize.STRING, allowNull: false },
      redirect_uri: { type: Sequelize.STRING, allowNull: true },
      scopes: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('tenant_sso_settings', {
      fields: ['tenant_id', 'provider'],
      type: 'unique',
      name: 'tenant_sso_settings_tenant_provider_unique'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tenant_sso_settings');
    await queryInterface.removeConstraint('tenant_email_templates', 'tenant_email_templates_tenant_type_unique');
    await queryInterface.dropTable('tenant_email_templates');
    await queryInterface.removeConstraint('tenant_api_keys', 'tenant_api_keys_tenant_keyid_unique');
    await queryInterface.dropTable('tenant_api_keys');
    await queryInterface.dropTable('webhook_deliveries');
    await queryInterface.dropTable('tenant_webhooks');
  }
};
