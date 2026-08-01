import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'abhinash' } },
    include: {
      organization: {
        include: {
          properties: true
        }
      },
      property: true
    }
  });

  console.log('Users found with abhinash:', users.map(u => ({
    id: u.id,
    email: u.email,
    name: (u as any).name,
    organizationId: u.organizationId,
    orgName: u.organization?.name,
    propertyId: u.propertyId,
    propertyName: u.property?.name,
    orgProperties: u.organization?.properties.map(p => ({ id: p.id, name: p.name, code: p.code }))
  })));

  const allProperties = await prisma.property.findMany();
  console.log('All properties count:', allProperties.length);
  console.log('All properties:', allProperties.map(p => ({ id: p.id, name: p.name, code: p.code })));
}

main().finally(() => prisma.$disconnect());
