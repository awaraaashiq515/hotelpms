const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating test Supplier account...');

  // 1. Ensure Organization exists
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found. Please run main seed first.');
    return;
  }

  // 2. Create/Get B2B_SUPPLIER Role
  const role = await prisma.role.upsert({
    where: { name: 'B2B_SUPPLIER' },
    update: {},
    create: {
      name: 'B2B_SUPPLIER',
      description: 'Role for B2B Suppliers to manage their orders',
    },
  });
  console.log('✅ Role B2B_SUPPLIER ready');

  // 3. Create a Sample B2B Supplier Profile
  const supplier = await prisma.b2BSupplier.upsert({
    where: { email: 'supplier@test.com' },
    update: {},
    create: {
      name: 'Fresh Veggies Co.',
      email: 'supplier@test.com',
      phone: '9876543210',
      address: 'Market Yard, Sector 4',
      category: 'Vegetables',
    },
  });
  console.log('✅ Supplier Profile "Fresh Veggies Co." ready');

  // 4. Create the User Account
  const passwordHash = await bcrypt.hash('supplier123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'supplier@test.com' },
    update: {
      roleId: role.id,
      supplierId: supplier.id,
    },
    create: {
      email: 'supplier@test.com',
      fullName: 'John Supplier',
      passwordHash: passwordHash,
      organizationId: org.id,
      roleId: role.id,
      supplierId: supplier.id,
      isActive: true,
    },
  });

  console.log('\n--- LOGIN CREDENTIALS ---');
  console.log(`Email: supplier@test.com`);
  console.log(`Password: supplier123`);
  console.log(`Role: B2B_SUPPLIER`);
  console.log('--------------------------\n');
  console.log('✅ Test account created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
