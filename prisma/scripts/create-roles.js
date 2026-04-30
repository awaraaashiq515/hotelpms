const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Find Organization and Property
  const org = await prisma.organization.findFirst();
  const property = await prisma.property.findFirst();

  if (!org || !property) {
    console.error('Organization or Property not found. Please seed the database first.');
    process.exit(1);
  }

  // 2. Ensure Roles exist
  const adminRole = await prisma.role.upsert({
    where: { name: 'RESTAURANTS_ADMIN' },
    update: {},
    create: {
      name: 'RESTAURANTS_ADMIN',
      description: 'Administrative access to website management',
    },
  });

  const posRole = await prisma.role.upsert({
    where: { name: 'POSSYSTEM' },
    update: {},
    create: {
      name: 'POSSYSTEM',
      description: 'Operational access to POS system',
    },
  });

  // 3. Create sample users
  await prisma.user.upsert({
    where: { email: 'admin@ordermint.com' },
    update: { roleId: adminRole.id },
    create: {
      fullName: 'Admin User',
      email: 'admin@ordermint.com',
      passwordHash: passwordHash,
      organizationId: org.id,
      propertyId: property.id,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'pos@ordermint.com' },
    update: { roleId: posRole.id },
    create: {
      fullName: 'POS User',
      email: 'pos@ordermint.com',
      passwordHash: passwordHash,
      organizationId: org.id,
      propertyId: property.id,
      roleId: posRole.id,
      isActive: true,
    },
  });

  console.log('Roles and test users created successfully!');
  console.log('Admin User: admin@ordermint.com / admin123');
  console.log('POS User: pos@ordermint.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
