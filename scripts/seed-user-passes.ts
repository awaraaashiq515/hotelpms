import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Explicitly attaching Pool Passes to ALL properties including hotel123...');

  const properties = await prisma.property.findMany();
  
  const samplePasses = [
    {
      name: 'Early Bird Morning Lap Pass',
      category: 'STANDARD',
      price: 350,
      duration: 'Morning Pass (6 AM - 10 AM)',
      capacity: 1,
      description: 'Refreshing early morning swim pass with access to steam room and complimentary detox tea.',
      includes: 'Olympic Pool Access, Detox Herbal Tea, High-Speed Shower & Steam Room',
      isActive: true,
    },
    {
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
      name: 'Weekend Royal Luxury Pool Suite Pass',
      category: 'VIP_CABANA',
      price: 2500,
      duration: 'Full Day (Weekend Special)',
      capacity: 3,
      description: 'Ultimate luxury experience featuring an exclusive pool suite, gourmet snacks, and dedicated butler service.',
      includes: 'Luxury AC Cabana Suite, Champagne Flutes, Gourmet Snack Platter, Butler Service',
      isActive: true,
    },
  ];

  // Seed for propertyId = null AND for every property in DB
  const targetPropertyIds = [null, ...properties.map(p => p.id)];

  for (const propId of targetPropertyIds) {
    for (const pass of samplePasses) {
      const exists = await prisma.poolPassCategory.findFirst({
        where: {
          name: pass.name,
          propertyId: propId
        }
      });
      if (!exists) {
        await prisma.poolPassCategory.create({
          data: {
            ...pass,
            propertyId: propId
          }
        });
        console.log(`+ Added pass "${pass.name}" for propertyId: ${propId || 'GLOBAL'}`);
      } else {
        console.log(`✓ Pass "${pass.name}" already exists for propertyId: ${propId || 'GLOBAL'}`);
      }
    }
  }

  console.log('Seeding finished!');
}

main().finally(() => prisma.$disconnect());
