'use strict';
require('dotenv').config();
const { Product, Tenant, Stock } = require('./models');
const sequelize = require('./config/database');

async function seedProducts() {
  try {
    const tenant = await Tenant.findOne({ where: { slug: 'demo' } });
    if (!tenant) {
        console.error('Demo tenant not found. Please run seed.js first.');
        process.exit(1);
    }

    const demoProducts = [
      {
        name: 'Quantum X-15 Pro Smartphone',
        description: 'Experience the pinnacle of mobile technology with the Quantum X-15 Pro. Featuring a sleek titanium aerospace-grade frame and the revolutionary Neural-Core A2 processor, this device is designed for those who demand more.',
        price: 1199.99,
        category: 'Electronics',
        brand: 'Quantum',
        color: 'Titanium Gray',
        size: '256GB',
        sku: 'QX15P-256-TG',
        images: [
          'https://images.unsplash.com/photo-1592890678503-5c6e97320c8d?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800'
        ],
        highlights: [
          'Aerospace-grade Titanium Frame',
          'Next-Gen Neural-Core A2 Processor',
          'Pro-Level Triple Camera System (50MP)',
          'All-Day Battery Life with Super-Fast Charging',
          'IP68 Water and Dust Resistance'
        ],
        specifications: {
          'Display': '6.7-inch OLED, 120Hz Pro-Motion',
          'Processor': 'Neural-Core A2 (4nm)',
          'RAM': '12GB LPDDR5X',
          'Battery': '5000mAh, 100W Wired / 50W Wireless',
          'Storage': '256GB UFS 4.0',
          'OS': 'QuantumOS 4'
        }
      },
      {
        name: 'ZenBook Air 14 Ultrabook',
        description: 'The ZenBook Air 14 sets a new standard for portability and power. At just 1.1kg, it fits perfectly in your life, while the M-Flex Silicon chip ensures you can breeze through any task.',
        price: 1499.00,
        category: 'Electronics',
        brand: 'ZenTech',
        color: 'Midnight Blue',
        size: '14-inch',
        sku: 'ZB-AIR-14-MB',
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1517336712461-4811499114f4?auto=format&fit=crop&q=80&w=800'
        ],
        highlights: [
          'Ultra-Thin 11mm Design',
          'Stunning 2.8K OLED Liquid Retina Display',
          'M-Flex Silicon for Advanced Performance',
          'Silent Fanless Cooling System',
          'Up to 20 Hours of Battery Life'
        ],
        specifications: {
          'Display': '14-inch OLED, 2880 x 1800, 400 nits',
          'Processor': 'M-Flex Silicon (8-core CPU, 10-core GPU)',
          'Memory': '16GB Unified RAM',
          'Storage': '512GB PCIe Gen 4 SSD',
          'Connectivity': '2x Thunderbolt 4, Wi-Fi 6E, Bluetooth 5.3',
          'Weight': '1.14 kg (2.5 lbs)'
        }
      }
    ];

    for (const pData of demoProducts) {
      const [product, created] = await Product.findOrCreate({
        where: { sku: pData.sku, tenantId: tenant.id },
        defaults: { ...pData, tenantId: tenant.id }
      });

      if (created) {
        await Stock.create({ productId: product.id, quantity: 50, tenantId: tenant.id });
        console.log(`✅ Seeded product: ${product.name}`);
      } else {
        await product.update(pData);
        console.log(`ℹ️ Updated product: ${product.name}`);
      }
    }

    console.log('🎉 Product seeding completed!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Failed to seed products:', err);
    process.exit(1);
  }
}

seedProducts();
