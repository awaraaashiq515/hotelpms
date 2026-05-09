
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Membership Demo Data...');

  const property = await prisma.property.findFirst();
  const org = await prisma.organization.findFirst();

  if (!property || !org) {
    console.error('No property or organization found. Please run seed.ts first.');
    return;
  }

  const propertyId = property.id;
  const organizationId = org.id;

  // 1. Create Membership Plans
  const plans = [
    {
      propertyId,
      name: 'Silver Member',
      description: '10% discount on orders above ₹1,000',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 1000,
      validityDays: 365,
    },
    {
      propertyId,
      name: 'Gold Member',
      description: '₹500 fixed discount on orders above ₹3,000',
      discountType: 'FIXED',
      discountValue: 500,
      minOrderValue: 3000,
      validityDays: 365,
    },
    {
      propertyId,
      name: 'Platinum Member',
      description: '20% flat discount on all orders',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 0,
      validityDays: 730,
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { id: `demo-plan-${plan.name.toLowerCase().replace(' ', '-')}` },
      create: {
        id: `demo-plan-${plan.name.toLowerCase().replace(' ', '-')}`,
        ...plan,
      },
      update: plan,
    });
  }
  console.log('✅ Membership Plans created.');

  // 2. Create a Demo Guest
  const guest = await prisma.guest.upsert({
    where: { id: 'demo-guest-id' },
    create: {
      id: 'demo-guest-id',
      organizationId,
      firstName: 'Rahul',
      lastName: 'Demo',
      mobile: '9876543210',
    },
    update: {
      mobile: '9876543210',
    },
  });
  console.log(`✅ Demo Guest created: ${guest.firstName} (${guest.mobile})`);

  // 3. Issue Membership Cards
  const cards = [
    {
      cardNumber: 'SILV-123456',
      membershipPlanId: 'demo-plan-silver-member',
      guestId: guest.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      cardNumber: 'GOLD-654321',
      membershipPlanId: 'demo-plan-gold-member',
      guestId: guest.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const card of cards) {
    await prisma.membershipCard.upsert({
      where: { cardNumber: card.cardNumber },
      create: card,
      update: card,
    });
  }
  console.log('✅ Demo Membership Cards issued.');
  console.log('\n🚀 Demo setup complete! You can now test these card numbers in POS.');
  console.log('Card 1: SILV-123456 (10% Off > ₹1000)');
  console.log('Card 2: GOLD-654321 (₹500 Off > ₹3000)');
  console.log('Or select guest "Rahul" (9876543210) to auto-fetch cards.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
