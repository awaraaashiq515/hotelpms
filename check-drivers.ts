
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const drivers = await prisma.driver.findMany({
    include: { property: { select: { name: true, organizationId: true } } }
  });
  console.log('--- DRIVERS ---');
  drivers.forEach(d => {
    console.log(`Driver: ${d.name}, Phone: ${d.phone}, Prop: ${d.property?.name}, OrgId: ${d.property?.organizationId}`);
  });

  const offers = await prisma.offer.findMany({
    include: { property: { select: { name: true, organizationId: true } } }
  });
  console.log('--- OFFERS ---');
  offers.forEach(o => {
    console.log(`Offer: ${o.title}, Prop: ${o.property?.name}, OrgId: ${o.property?.organizationId}`);
  });

  const properties = await prisma.property.findMany();
  console.log('--- PROPERTIES ---');
  properties.forEach(p => {
    console.log(`Property: ${p.name}, ID: ${p.id}, OrgID: ${p.organizationId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
