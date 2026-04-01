'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE tenants
      SET settings = settings
        || jsonb_build_object(
          'currency', COALESCE(NULLIF(settings->>'currency',''),'INR'),
          'taxRate', COALESCE(NULLIF(settings->>'taxRate',''),'0'),
          'paymentGateway', COALESCE(NULLIF(settings->>'paymentGateway',''),'mock'),
          'invoiceTemplate', COALESCE(NULLIF(settings->>'invoiceTemplate',''),'default'),
          'supportContacts', COALESCE(
            settings->'supportContacts',
            jsonb_build_object(
              'email', CONCAT('support@', COALESCE(NULLIF(slug,''),'brand'), '.com'),
              'phone', '+91 0000000000'
            )
          )
        );
    `);
  },

  down: async () => {
    // No-op (cannot safely revert merged settings)
  }
};
