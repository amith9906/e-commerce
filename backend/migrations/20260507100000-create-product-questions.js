'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('product_questions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: true },
      question: { type: Sequelize.TEXT, allowNull: false },
      answer: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'published', 'hidden'),
        allowNull: false,
        defaultValue: 'pending'
      },
      answered_by: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.addConstraint('product_questions', {
      fields: ['tenant_id', 'product_id', 'question'],
      type: 'unique',
      name: 'product_questions_unique_per_product'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('product_questions');
  }
};
