import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating website settings with new contact info...');

  // Update WebsiteSettings
  const settings = await prisma.websiteSettings.findFirst();
  if (settings) {
    await prisma.websiteSettings.update({
      where: { id: settings.id },
      data: {
        hotelName: 'OrderMint',
        storyTitle: 'Our Mission – Redefining POS for the Modern Era',
        email: 'support@ordermint.com',
        address: 'Mandi, Himachal Pradesh 175001',
        phone: '8219076305',
      },
    });
    console.log('Updated existing WebsiteSettings.');
  } else {
    await prisma.websiteSettings.create({
      data: {
        hotelName: 'OrderMint',
        storyTitle: 'Our Mission – Redefining POS for the Modern Era',
        email: 'support@ordermint.com',
        address: 'Mandi, Himachal Pradesh 175001',
        phone: '8219076305',
      },
    });
    console.log('Created new WebsiteSettings.');
  }

  console.log('Branding and contact update complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
