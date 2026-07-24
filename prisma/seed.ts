import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Upsert Organization
  const org = await prisma.organization.upsert({
    where: { email: 'root@system.com' },
    update: {
      updatedAt: new Date(),
    },
    create: {
      id: 'system-root-org',
      name: 'System Root Org',
      email: 'root@system.com',
      updatedAt: new Date(),
    },
  });

  // 2. Upsert Property
  const property = await prisma.property.upsert({
    where: { code: 'MB01' },
    update: {
      updatedAt: new Date(),
    },
    create: {
      id: 'main-branch',
      name: 'Main Branch',
      code: 'MB01',
      organizationId: org.id,
      updatedAt: new Date(),
    },
  });

  // 3. Upsert Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      id: 'role-super-admin',
      name: 'SUPER_ADMIN',
      description: 'Full system access',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'RESTAURANTS_ADMIN' },
    update: {},
    create: {
      id: 'role-restaurants-admin',
      name: 'RESTAURANTS_ADMIN',
      description: 'POS Operational Access',
    },
  });

  const posRole = await prisma.role.upsert({
    where: { name: 'POSSYSTEM' },
    update: {},
    create: {
      id: 'role-possystem',
      name: 'POSSYSTEM',
      description: 'POS Terminal Operator Access',
    },
  });

  await prisma.role.upsert({
    where: { name: 'HOTEL_ADMIN' },
    update: {},
    create: {
      id: 'role-hotel-admin',
      name: 'HOTEL_ADMIN',
      description: 'Hotel Property Owner & Manager Access',
    },
  });


  // 4. Upsert User
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      passwordHash: passwordHash,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'super-admin',
      fullName: 'Super Admin',
      email: 'admin@example.com',
      passwordHash: passwordHash,
      organizationId: org.id,
      propertyId: property.id,
      roleId: superAdminRole.id,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // 5. Default Payment Modes
  const paymentModes = [
    { name: 'Cash', type: 'CASH' },
    { name: 'Credit Card', type: 'CARD' },
    { name: 'UPI / QR', type: 'UPI' },
  ];

  for (const mode of paymentModes) {
    await prisma.paymentMode.upsert({
      where: { 
        propertyId_name: {
          propertyId: property.id,
          name: mode.name
        }
      },
      update: {},
      create: {
        id: randomUUID(),
        name: mode.name,
        type: mode.type,
        propertyId: property.id,
        isActive: true,
      },
    });
  }

  // 6. Default Account Groups & Accounts
  const assetGroup = await prisma.accountGroup.upsert({
    where: { id: 'cash-assets-group' },
    update: {},
    create: {
      id: 'cash-assets-group',
      name: 'Cash & Bank',
      nature: 'ASSET',
      organizationId: org.id,
    },
  });

  const cashAccount = await prisma.account.upsert({
    where: { id: `cash-${property.id}` },
    update: {},
    create: {
      id: `cash-${property.id}`,
      name: 'Cash Account',
      accountType: 'CASH',
      openingBalanceType: 'DEBIT',
      accountGroupId: assetGroup.id,
      propertyId: property.id,
      organizationId: org.id,
    },
  });

  // 7. Default Outlet
  await prisma.outlet.upsert({
    where: { id: 'default-pos-outlet' },
    update: {},
    create: {
      id: 'default-pos-outlet',
      name: 'Main POS Outlet',
      type: 'RESTAURANT',
      propertyId: property.id,
    },
  });
  
  // 8. Default Experiences
  const experiences = [
    {
      title: 'Rohtang Pass',
      description: 'A high mountain pass on the eastern Pir Panjal Range of the Himalayas around 51 km from Manali. It connects the Kullu Valley with the Lahaul and Spiti Valleys of Himachal Pradesh.',
      imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200',
      order: 1,
      isActive: true
    },
    {
      title: 'Solang Valley',
      description: 'Solang Valley derives its name from combination of words Solang and Nallah. It is a side valley at the top of the Kullu Valley in Himachal Pradesh, India, known for its summer and winter sport conditions.',
      imageUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1200',
      order: 2,
      isActive: true
    },
    {
      title: 'Hadimba Temple',
      description: 'Hidimba Devi Temple, locally known as Dhungari Temple, also known variously as the Hadimba Temple, is located in Manāli, a hill station in the State of Himāchal Pradesh in north India.',
      imageUrl: 'https://images.unsplash.com/photo-1615552399818-724f8d4e7826?q=80&w=1200',
      order: 3,
      isActive: true
    }
  ];

  for (const exp of experiences) {
    await prisma.websiteExperience.upsert({
      where: { id: exp.title.toLowerCase().replace(/\s+/g, '-') }, 
      update: {
        updatedAt: new Date(),
      },
      create: {
        id: exp.title.toLowerCase().replace(/\s+/g, '-'),
        title: exp.title,
        description: exp.description,
        imageUrl: exp.imageUrl,
        order: exp.order,
        isActive: exp.isActive,
        updatedAt: new Date(),
      }
    });
  }

  console.log('Seeding completed successfully!');
  console.log('Credentials: admin@example.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};
