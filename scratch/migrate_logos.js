const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.websiteSettings.findFirst();
  if (settings && settings.logoUrl && settings.logoUrl.startsWith('/uploads/')) {
    const newUrl = settings.logoUrl.replace('/uploads/', '/api/images/');
    await prisma.websiteSettings.update({
      where: { id: settings.id },
      data: { logoUrl: newUrl }
    });
    console.log(`Updated logoUrl from ${settings.logoUrl} to ${newUrl}`);
  } else {
    console.log('No logoUrl update needed or settings not found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
