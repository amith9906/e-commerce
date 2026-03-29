'use strict';
require('dotenv').config({ path: '../.env' }); // Adjust path if needed
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// Import all models
const { Tenant, User, BrandConfig } = require('../models');

async function seedDatabase() {
  try {
    console.log('🌱 Starting Database Seeding...');
    
    // Ensure database schema exists before we seed
    await sequelize.sync({ alter: true });
    
    // 1. Create a Platform Super Admin (Not tied to any single tenant)
    const superAdminEmail = 'superadmin@example.com';
    let superAdmin = await User.findOne({ where: { email: superAdminEmail } });

    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'System Super Admin',
        email: superAdminEmail,
        passwordHash: await bcrypt.hash('Admin@123', 12),
        role: 'superadmin',
        isVerified: true,
        tenantId: null // platform level role
      });
      console.log(`✅ Super Admin created: ${superAdminEmail} / Admin@123`);
    } else {
      console.log(`ℹ️ Super Admin already exists.`);
    }

    // 2. Create a specific Tenant
    const tenantSlug = 'demo';
    let demoTenant = await Tenant.findOne({ where: { slug: tenantSlug } });

    if (!demoTenant) {
      demoTenant = await Tenant.create({
        name: 'Demo E-Commerce Store',
        slug: tenantSlug,
        plan: 'pro',
        status: 'active'
      });
      console.log(`✅ Tenant created: ${tenantSlug}.yourdomain.com`);
      
      // Default brand config for this tenant
      await BrandConfig.bulkCreate([
        { tenantId: demoTenant.id, key: 'storeName', value: 'Demo E-Commerce Store' },
        { tenantId: demoTenant.id, key: 'primaryColor', value: '#3b82f6' }
      ]);
    } else {
      console.log(`ℹ️ Tenant '${tenantSlug}' already exists.`);
    }

    // 3. Create a Tenant Admin
    const tenantAdminEmail = 'admin@demo.com';
    let tenantAdmin = await User.findOne({ where: { email: tenantAdminEmail, tenantId: demoTenant.id } });
    
    if (!tenantAdmin) {
      tenantAdmin = await User.create({
        name: 'Demo Store Admin',
        email: tenantAdminEmail,
        passwordHash: await bcrypt.hash('Admin@123', 12),
        role: 'admin',
        isVerified: true,
        tenantId: demoTenant.id // This ties the admin to the tenant
      });
      console.log(`✅ Tenant Admin created: ${tenantAdminEmail} / Admin@123`);
    } else {
      console.log(`ℹ️ Tenant Admin already exists.`);
    }

    // 4. Create a Customer for the Tenant
    const customerEmail = 'customer@demo.com';
    let customer = await User.findOne({ where: { email: customerEmail, tenantId: demoTenant.id } });
    
    if (!customer) {
      customer = await User.create({
        name: 'Demo Customer',
        email: customerEmail,
        passwordHash: await bcrypt.hash('Customer@123', 12),
        role: 'customer',
        isVerified: true,
        tenantId: demoTenant.id // Ties this customer to this specific tenant
      });
      console.log(`✅ Customer created: ${customerEmail} / Customer@123`);
    } else {
      console.log(`ℹ️ Customer already exists.`);
    }

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Database seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();
