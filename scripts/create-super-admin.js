const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'superadmin@pos.com';
  const password = 'admin123';
  const fullName = 'Super Admin';
  const organizationId = 'cmnfz2q8e0015hef1uto03jij';
  const propertyId = 'cmnfz7gms001bhef1i5muffo0';
  const roleId = 'cmn8kl8gn00038iqqtf66f2tf'; // SUPER_ADMIN

  console.log(`Checking if user ${email} exists...`);
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log('User already exists. Updating role to SUPER_ADMIN...');
    await prisma.user.update({
      where: { email },
      data: {
        roleId,
        onboardingCompleted: true,
        isActive: true
      }
    });
    console.log('User updated successfully.');
  } else {
    console.log('Creating new SUPER_ADMIN user...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        organizationId,
        propertyId,
        roleId,
        onboardingCompleted: true,
        isActive: true
      }
    });
    console.log(`SUPER_ADMIN user created successfully.`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
}

createSuperAdmin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
