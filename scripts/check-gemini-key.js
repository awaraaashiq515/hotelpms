const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.websiteSettings.findFirst();
  console.log('WebsiteSettings:', settings);
  
  const allProperties = await prisma.property.findMany();
  console.log('Properties:', allProperties.map(p => ({ id: p.id, name: p.name, phone: p.phone, whatsAppProvider: p.whatsAppProvider })));
}

main().catch(err => console.error(err));
