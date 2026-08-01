import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
 con
  // 1. Create B2B Suppliers
  const suppliers = [
    {
      name: 'Fresh Farms Vegetable Supply',
      email: 'freshfarms@example.com',
      phone: '9876543210',
      address: 'Sabzi Mandi, Sector 26, Chandigarh',
      category: 'Vegetables',
      gstNumber: '03AAAAA0000A1Z5',
    },
    {
      name: 'Daily Dairy Products',
      email: 'dailydairy@example.com',
      phone: '9876543211',
      address: 'Industrial Area Phase 1, Panchkula',
      category: 'Dairy',
      gstNumber: '06BBBBB1111B1Z6',
    },
    {
      name: 'Premium Meat & Poultry',
      email: 'premiummeat@example.com',
      phone: '9876543212',
      address: 'Main Market, Mohali',
      category: 'Meat',
      gstNumber: '04CCCCC2222C1Z7',
    },
  ];

  for (const s of suppliers) {
    const supplier = await prisma.b2BSupplier.upsert({
      where: { email: s.email },
      update: {},
      create: {
        id: randomUUID(),
        ...s,
      },
    });

    // 2. Create Products for each supplier
    if (s.category === 'Vegetables') {
      const vegProducts = [
        { name: 'Potatoes (A-Grade)', price: 25, unit: 'kg', stockQuantity: 500, category: 'Root Vegetables' },
        { name: 'Onions (Red)', price: 40, unit: 'kg', stockQuantity: 300, category: 'Root Vegetables' },
        { name: 'Tomatoes (Hybrid)', price: 30, unit: 'kg', stockQuantity: 200, category: 'Vegetables' },
        { name: 'Cauliflower', price: 50, unit: 'kg', stockQuantity: 100, category: 'Vegetables' },
      ];
      for (const p of vegProducts) {
        await prisma.b2BProduct.create({
          data: { 
            id: randomUUID(),
            ...p, 
            supplierId: supplier.id 
          },
        });
      }
    } else if (s.category === 'Dairy') {
      const dairyProducts = [
        { name: 'Full Cream Milk', price: 60, unit: 'Litre', stockQuantity: 200, category: 'Milk' },
        { name: 'Fresh Paneer', price: 350, unit: 'kg', stockQuantity: 50, category: 'Paneer' },
        { name: 'Amul Butter (Bulk Pack)', price: 480, unit: 'kg', stockQuantity: 100, category: 'Butter' },
      ];
      for (const p of dairyProducts) {
        await prisma.b2BProduct.create({
          data: { 
            id: randomUUID(),
            ...p, 
            supplierId: supplier.id 
          },
        });
      }
    }
  }

  console.log('B2B Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
