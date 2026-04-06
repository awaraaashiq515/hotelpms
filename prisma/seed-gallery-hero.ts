import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.websiteSettings.findFirst();
  
  const videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-dramatic-birds-eye-view-of-snowy-mountains-40540-large.mp4";
  const imageUrl = "https://images.unsplash.com/photo-1590523741877-29a3cb73f2dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  if (settings) {
    await prisma.websiteSettings.update({
      where: { id: settings.id },
      data: {
        galleryHeroVideoUrl: videoUrl,
        galleryHeroImageUrl: imageUrl,
      },
    });
    console.log('Gallery hero settings updated.');
  } else {
    await prisma.websiteSettings.create({
      data: {
        galleryHeroVideoUrl: videoUrl,
        galleryHeroImageUrl: imageUrl,
      },
    });
    console.log('New gallery hero settings created.');
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

export {};
