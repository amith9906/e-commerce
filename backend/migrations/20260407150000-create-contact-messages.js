'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      subject: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.ENUM('new', 'read', 'resolved'),
        allowNull: false,
        defaultValue: 'new',
      },
      admin_notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('contact_messages', ['tenant_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('contact_messages');
  },
};
