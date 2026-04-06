const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('--- DRIVER INCENTIVE DIAGNOSIS ---');
  
  const drivers = await prisma.driver.findMany({
    include: {
      offerProgresses: { include: { offer: true } },
      offerHistories: true
    }
  });

  for (const d of drivers) {
    console.log(`\nDriver: ${d.name} (${d.phone})`);
    console.log(`Active Progresses: ${d.offerProgresses.length}`);
    d.offerProgresses.forEach(p => {
      console.log(`  - Offer: ${p.offer.title} (Type: ${p.offer.offerType})`);
      console.log(`    Status: ${p.status}, Progress: ${p.progressPercent}%, Rides: ${p.completedRides}/${p.offer.targetRides}, Refs: ${p.completedReferrals}/${p.offer.targetReferrals}`);
    });
    console.log(`History (Wins): ${d.offerHistories.length}`);
  }

  const offers = await prisma.offer.findMany();
  console.log(`\nGlobal Offers: ${offers.length}`);
  offers.forEach(o => {
    console.log(`  - ${o.title} (ID: ${o.id}, Priority: ${o.priority}, Active: ${o.isActive})`);
  });

  await prisma.$disconnect();
}

diagnose().catch(console.error);
