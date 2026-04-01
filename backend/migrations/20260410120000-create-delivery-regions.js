'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('delivery_regions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      lead_time_days: { type: Sequelize.INTEGER, allowNull: true },
      locations: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addConstraint('delivery_regions', {
      fields: ['tenant_id', 'slug'],
      type: 'unique',
      name: 'delivery_regions_tenant_slug_unique'
    });

    await queryInterface.createTable('delivery_restrictions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      region_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'delivery_regions', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.UUID, allowNull: true },
      category: { type: Sequelize.STRING, allowNull: true },
      is_allowed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      min_order_value: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      max_weight_kg: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addConstraint('delivery_restrictions', {
      fields: ['region_id', 'product_id', 'category'],
      type: 'unique',
      name: 'delivery_restrictions_region_product_category_unique'
    });

    await queryInterface.addColumn('orders', 'delivery_region_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'delivery_regions', key: 'id' },
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'delivery_region_id');
    await queryInterface.dropTable('delivery_restrictions');
    await queryInterface.dropTable('delivery_regions');
  }
};
