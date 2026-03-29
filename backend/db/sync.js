'use strict';
require('dotenv').config();
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// Import all models (already registers associations)
const { Tenant, User, BrandConfig } = require('../models');

async function syncDB() {
  try {
    console.log('Syncing database...');
    
    // Migrations are now managing the schema.
    // We synchronize only the minimal aspects (or nothing) to prevent overriding migrations.
    // If you need to scaffold the DB, use `npx sequelize-cli db:migrate` instead.
    // await sequelize.sync({ alter: true });
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Create default super admin if doesn't exist
    const superAdminEmail = 'superadmin@example.com';
    let superAdmin = await User.findOne({ where: { email: superAdminEmail } });

    if (!superAdmin) {
      const passwordHash = await bcrypt.hash('Admin@123', 12);
      superAdmin = await User.create({
        name: 'System Super Admin',
        email: superAdminEmail,
        passwordHash,
        role: 'superadmin',
        isVerified: true,
        tenantId: null // platform level
      });
      console.log(`✅ Default Super Admin created: ${superAdminEmail} / Admin@123`);
    } else {
      console.log(`ℹ️ Super Admin already exists: ${superAdminEmail}`);
    }

    // Create a default tenant for testing if no tenants exist
    const tenantCount = await Tenant.count();
    if (tenantCount === 0) {
      const defaultTenant = await Tenant.create({
        name: 'Demo Store',
        slug: 'demo',
        plan: 'pro'
      });
      console.log(`✅ Default Tenant created: demo.yourdomain.com`);
      
      // Default brand config
      await BrandConfig.bulkCreate([
        { tenantId: defaultTenant.id, key: 'storeName', value: 'Demo E-Commerce Store' },
        { tenantId: defaultTenant.id, key: 'primaryColor', value: '#3b82f6' }
      ]);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Database sync failed:', err);
    process.exit(1);
  }
}

syncDB();
