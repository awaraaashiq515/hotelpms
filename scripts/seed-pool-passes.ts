import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Global Pool Pass Categories into database...');

  // Update existing pool pass categories to propertyId: null so all properties see them
  await prisma.poolPassCategory.updateMany({
    data: { propertyId: null }
  });

  const categories = [
    {
      propertyId: null,
      name: 'Standard Day Pool Pass',
      category: 'STANDARD',
      price: 500,
      duration: 'Full Day',
      capacity: 1,
      description: 'Access to main swimming pool, poolside loungers, and locker room facilities.',
      includes: 'Locker, Clean Towel, Pool Access, Shower Room',
      isActive: true,
    },
    {
      propertyId: null,
      name: 'All-Day VIP Cabana Pass',
      category: 'VIP_CABANA',
      price: 1200,
      duration: 'Full Day',
      capacity: 2,
      description: 'Reserved private poolside cabana with cushioned sunbeds, premium towel service, and welcome drinks.',
      includes: 'Private Cabana, Sunbeds, Welcome Drinks, Premium Towels, Dedicated Server',
      isActive: true,
    },
    {
      propertyId: null,
      name: 'Family Splash & Fun Pass',
      category: 'FAMILY_PASS',
      price: 1800,
      duration: 'Full Day',
      capacity: 4,
      description: 'Group pass for up to 2 adults and 2 kids with complimentary pool floats, snacks, and fresh fruit juices.',
      includes: '4 Pool Passes, Pool Floats & Toys, Welcome Juices, Fruit Basket, Lockers',
      isActive: true,
    },
    {
      propertyId: null,
      name: 'Sunset Cocktail & Jacuzzi Pass',
      category: 'SUNSET_PASS',
      price: 1500,
      duration: 'Evening Pass (4 PM - 9 PM)',
      capacity: 2,
      description: 'Evening access to heated infinity pool and jacuzzi with complimentary signature cocktails and lounge music.',
      includes: 'Heated Jacuzzi Access, 2 Signature Poolside Cocktails, Evening DJ Lounge Access',
      isActive: true,
    },
    {
      propertyId: null,
      name: 'Weekend Royal Luxury Pool Suite Pass',
      category: 'VIP_CABANA',
      price: 2500,
      duration: 'Full Day (Weekend Special)',
      capacity: 3,
      description: 'Ultimate luxury experience featuring an exclusive pool suite, gourmet snacks, and dedicated butler service.',
      includes: 'Luxury AC Cabana Suite, Champagne Flutes, Gourmet Snack Platter, Butler Service',
      isActive: true,
    },
    {
      propertyId: null,
      name: 'Early Bird Morning Lap Pass',
      category: 'STANDARD',
      price: 350,
      duration: 'Morning Pass (6 AM - 10 AM)',
      capacity: 1,
      description: 'Refreshing early morning swim pass with access to steam room and complimentary detox tea.',
      includes: 'Olympic Pool Access, Detox Herbal Tea, High-Speed Shower & Steam Room',
      isActive: true,
    },
  ];

  for (const cat of categories) {
    const existing = await prisma.poolPassCategory.findFirst({
      where: { name: cat.name }
    });
    if (!existing) {
      await prisma.poolPassCategory.create({ data: cat });
      console.log(`+ Added: ${cat.name} (₹${cat.price})`);
    } else {
      await prisma.poolPassCategory.update({
        where: { id: existing.id },
        data: { propertyId: null, isActive: true }
      });
      console.log(`✓ Updated to Global: ${cat.name}`);
    }
  }

  console.log('Pool Pass Categories seeding & global sync complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
