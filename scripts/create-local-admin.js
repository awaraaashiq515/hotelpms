/**
 * GuestFlow PMS - Create / Verify Local Admin User
 * 
 * Usage:
 *   node scripts/create-local-admin.js
 *   node scripts/create-local-admin.js admin@guestflow.local Admin@123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@guestflow.local';
  const plainPassword = process.argv[3] || 'Admin@123';
  const fullName = 'Local Super Admin';

  console.log(`\n🔧 GuestFlow PMS — Create / Verify Local Admin`);
  console.log(`   Email: ${email}`);

  // Find Super Admin role
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN' }
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.findFirst();
  }
  if (!superAdminRole) {
    throw new Error('No roles found in database');
  }

  // Find default organization and property
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found in database');
  }

  const prop = await prisma.property.findFirst({
    where: { organizationId: org.id }
  }) || await prisma.property.findFirst();

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        roleId: superAdminRole.id,
        isActive: true,
        onboardingCompleted: true,
      }
    });
    console.log(`\n✅ Existing user updated with new password:`);
    console.log(`   Email    : ${email}`);
    console.log(`   Password : ${plainPassword}`);
    console.log(`   Role     : ${superAdminRole.name}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Create the super admin user
  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      roleId: superAdminRole.id,
      organizationId: org.id,
      propertyId: prop ? prop.id : null,
      isActive: true,
      onboardingCompleted: true,
    },
  });

  console.log(`\n✅ Super Admin created:`);
  console.log(`   Email    : ${user.email}`);
  console.log(`   Password : ${plainPassword}`);
  console.log(`   Role     : ${superAdminRole.name}`);
  console.log(`   Org ID   : ${user.organizationId}\n`);
}

main()
  .catch((err) => {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
