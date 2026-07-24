import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
const prisma = new PrismaClient();

async function main() {
  const images = [
    { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Exterior', order: 1 },
    { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Rooms', order: 2 },
    { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Interior', order: 3 },
    { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Rooms', order: 4 },
    { url: 'https://images.unsplash.com/photo-1549412000-dc4093847594?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Manali Views', order: 5 },
    { url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Manali Views', order: 6 },
    { url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Restaurant', order: 7 },
    { url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Exterior', order: 8 },
    { url: 'https://images.unsplash.com/photo-1615552399818-724f8d4e7826?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', category: 'Interior', order: 9 },
  ];

  for (const img of images) {
    await prisma.websiteGalleryImage.create({
      data: {
        id: randomUUID(),
        ...img,
        updatedAt: new Date(),
      }
    });
  }

  console.log('Gallery seeding completed!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

export {};
