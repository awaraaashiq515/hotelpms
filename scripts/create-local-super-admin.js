const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createLocalSuperAdmin() {
  console.log('🔍 Checking database...\n');

  // Step 1: Find or create SUPER_ADMIN role
  let role = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  if (!role) {
    console.log('Creating SUPER_ADMIN role...');
    role = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Super Administrator' }
    });
  }
  console.log(`✅ Role: ${role.name} (${role.id})`);

  // Step 2: Find or create Organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    console.log('Creating Organization...');
    org = await prisma.organization.create({
      data: {
        name: 'OrderMint POS',
        businessType: 'Restaurant',
      }
    });
  }
  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // Step 3: Find or create Property
  let property = await prisma.property.findFirst({ where: { organizationId: org.id } });
  if (!property) {
    console.log('Creating Property...');
    property = await prisma.property.create({
      data: {
        organizationId: org.id,
        name: 'Main Branch',
        code: 'MAIN001',
      }
    });
  }
  console.log(`✅ Property: ${property.name} (${property.id})`);

  // Step 4: Create or update Super Admin user
  const email = 'superadmin@ordermint.com';
  const password = 'Admin@123';
  const fullName = 'Super Admin';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('\n⚠️  User already exists! Updating role & activating...');
    await prisma.user.update({
      where: { email },
      data: {
        roleId: role.id,
        onboardingCompleted: true,
        isActive: true,
      }
    });
    console.log('✅ User updated successfully!');
  } else {
    console.log('\nCreating Super Admin user...');
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        organizationId: org.id,
        propertyId: property.id,
        roleId: role.id,
        onboardingCompleted: true,
        isActive: true,
      }
    });
    console.log('✅ Super Admin created successfully!');
  }

  console.log('\n========================================');
  console.log('🎉 LOGIN CREDENTIALS (LOCAL)');
  console.log('========================================');
  console.log(`📧 Email   : ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('========================================\n');
}

createLocalSuperAdmin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
