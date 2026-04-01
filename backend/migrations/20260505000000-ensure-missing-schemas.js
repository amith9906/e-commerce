'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const describe = async (table) => await queryInterface.describeTable(table).catch(() => null);

    const tenantTable = await describe('tenants');
    if (tenantTable && !tenantTable.settings) {
      await queryInterface.addColumn('tenants', 'settings', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Tenant-specific overrides and settings'
      });
    }

    const paymentsTable = await describe('payments');
    if (paymentsTable) {
      if (!paymentsTable.metadata) {
        await queryInterface.addColumn('payments', 'metadata', {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {}
        });
      }
      if (!paymentsTable.gateway_id) {
        await queryInterface.addColumn('payments', 'gateway_id', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      if (!paymentsTable.refund_id) {
        await queryInterface.addColumn('payments', 'refund_id', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
    }

    const productsTable = await describe('products');
    if (productsTable) {
      if (!productsTable.rating_avg) {
        await queryInterface.addColumn('products', 'rating_avg', {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: false,
          defaultValue: 0
        });
      }
      if (!productsTable.rating_count) {
        await queryInterface.addColumn('products', 'rating_count', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        });
      }
      if (!productsTable.image_url) {
        await queryInterface.addColumn('products', 'image_url', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
    }

    const pricingRulesTable = await describe('pricing_rules');
    if (pricingRulesTable && !pricingRulesTable.product_id) {
      await queryInterface.addColumn('pricing_rules', 'product_id', {
        type: Sequelize.UUID,
        allowNull: true
      });
    }

    const productReviewsTable = await describe('product_reviews');
    if (!productReviewsTable) {
      await queryInterface.createTable('product_reviews', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
        product_id: { type: Sequelize.UUID, allowNull: false },
        user_id: { type: Sequelize.UUID, allowNull: false },
        rating: { type: Sequelize.INTEGER, allowNull: false },
        comment: { type: Sequelize.TEXT, allowNull: true },
        images: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        is_verified_purchase: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        created_by: { type: Sequelize.UUID, allowNull: true },
        updated_by: { type: Sequelize.UUID, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      await queryInterface.addConstraint('product_reviews', {
        fields: ['tenant_id', 'product_id', 'user_id'],
        type: 'unique',
        name: 'product_reviews_tenant_product_user_unique'
      });
    }

    const contactTable = await describe('contact_messages');
    if (!contactTable) {
      await queryInterface.createTable('contact_messages', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false },
        subject: { type: Sequelize.STRING, allowNull: false },
        message: { type: Sequelize.TEXT, allowNull: false },
        status: { type: Sequelize.ENUM('new', 'read', 'resolved'), allowNull: false, defaultValue: 'new' },
        admin_notes: { type: Sequelize.TEXT, allowNull: true },
        created_by: { type: Sequelize.UUID, allowNull: true },
        updated_by: { type: Sequelize.UUID, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      await queryInterface.addIndex('contact_messages', ['tenant_id']);
    }
  },

  down: async () => {
    // Safety migration: do not revert column additions in this patch.
  }
};
