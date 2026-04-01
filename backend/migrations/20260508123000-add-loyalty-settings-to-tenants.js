'use strict';

module.exports = {
  async up(queryInterface) {
    const [tenants] = await queryInterface.sequelize.query('SELECT id, settings FROM tenants');
    for (const tenant of tenants) {
      const settings = tenant.settings || {};
      if (!settings.loyalty) {
        settings.loyalty = {
          pointsPerCurrency: 0.01, // 1 point per 100 currency units by default
          valuePerPoint: 1, // 1 point equals 1 currency unit on redemption
          redemptionEnabled: true
        };
        await queryInterface.sequelize.query(
          'UPDATE tenants SET settings = :settings WHERE id = :id',
          {
            replacements: { id: tenant.id, settings: JSON.stringify(settings) }
          }
        );
      }
    }
  },

  async down(queryInterface) {
    const [tenants] = await queryInterface.sequelize.query('SELECT id, settings FROM tenants');
    for (const tenant of tenants) {
      const settings = tenant.settings || {};
      if (settings.loyalty) {
        delete settings.loyalty;
        await queryInterface.sequelize.query(
          'UPDATE tenants SET settings = :settings WHERE id = :id',
          {
            replacements: { id: tenant.id, settings: JSON.stringify(settings) }
          }
        );
      }
    }
  }
};
