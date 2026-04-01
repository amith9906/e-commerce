'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const productReviewsTable = await queryInterface.describeTable('product_reviews').catch(() => null);
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

    const contactMessagesTable = await queryInterface.describeTable('contact_messages').catch(() => null);
    if (!contactMessagesTable) {
      await queryInterface.createTable('contact_messages', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        tenant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false },
        subject: { type: Sequelize.STRING, allowNull: false },
        message: { type: Sequelize.TEXT, allowNull: false },
        status: {
          type: Sequelize.ENUM('new', 'read', 'resolved'),
          allowNull: false,
          defaultValue: 'new'
        },
        admin_notes: { type: Sequelize.TEXT, allowNull: true },
        created_by: { type: Sequelize.UUID, allowNull: true },
        updated_by: { type: Sequelize.UUID, allowNull: true },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('contact_messages', ['tenant_id']);
    }
  },
  down: async () => {
    // Intentionally left blank; existing tables should not be dropped by this safety migration.
  }
};
