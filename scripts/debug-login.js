const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testLogin() {
  const email = 'superadmin@ordermint.com';
  const password = 'Admin@123';

  console.log('🔍 Testing login flow...\n');

  try {
    // Step 1: Find user
    console.log('Step 1: Finding user...');
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        },
        organization: {
          include: {
            package: {
              include: { features: true }
            }
          }
        }
      },
    });

    if (!user) {
      console.log('❌ User NOT found! Run create-local-super-admin.js first.');
      return;
    }

    console.log(`✅ User found: ${user.fullName} (${user.email})`);
    console.log(`   Role: ${user.role.name}`);
    console.log(`   isActive: ${user.isActive}`);
    console.log(`   onboardingCompleted: ${user.onboardingCompleted}`);

    // Step 2: Check password
    console.log('\nStep 2: Checking password...');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`   Password valid: ${isValid ? '✅ YES' : '❌ NO'}`);

    if (!isValid) {
      console.log('   ❌ Wrong password hash. Resetting password...');
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { passwordHash: newHash }
      });
      console.log('   ✅ Password reset done!');
    }

    // Step 3: Check package
    console.log('\nStep 3: Checking organization & package...');
    const org = user.organization;
    console.log(`   Org: ${org?.name ?? '❌ NULL'}`);
    console.log(`   Package: ${org?.package?.name ?? 'None (OK for super admin)'}`);

    // Step 4: Check role redirect
    console.log('\nStep 4: Redirect check...');
    if (user.role.name === 'SUPER_ADMIN') {
      console.log('   ✅ Will redirect to: /admin/dashboard');
    } else if (user.role.name === 'RESTAURANTS_ADMIN') {
      console.log('   Will redirect to: /dashboard');
    } else {
      console.log(`   Will redirect to: /operations (role: ${user.role.name})`);
    }

    console.log('\n========================================');
    console.log('✅ Login flow should work!');
    console.log('========================================');
    console.log(`Email   : ${email}`);
    console.log(`Password: ${password}`);
    console.log('URL     : http://localhost:3000/login');
    console.log('========================================\n');

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('\nFull error:', err);
  }
}

testLogin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
