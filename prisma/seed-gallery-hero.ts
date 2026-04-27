import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fetch existing website settings to update
  const settings = await prisma.websiteSettings.findFirst();

  // Define URLs for the hero video and image
  const videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-dramatic-birds-eye-view-of-snowy-mountains-40540-large.mp4";
  const imageUrl = "https://images.unsplash.com/photo-1590523741877-29a3cb73f2dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  // Update website settings with hero and gallery data
  if (settings) {
    await prisma.websiteSettings.update({
      where: { id: settings.id },
      data: {
        heroTitle: "Experience the Best Dining",
        heroSubtitle: "Delicious food, great atmosphere, and unforgettable memories.",
        heroVideo: videoUrl,
        heroImage: imageUrl,
      },
    });
    console.log('Website settings seeded successfully with hero data.');
  } else {
    await prisma.websiteSettings.create({
      data: {
        heroTitle: "Experience the Best Dining",
        heroSubtitle: "Delicious food, great atmosphere, and unforgettable memories.",
        heroVideo: videoUrl,
        heroImage: imageUrl,
      },
    });
    console.log('New hero settings created.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { };
