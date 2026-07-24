import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst();
  if (!property) {
    console.error("No property found.");
    return;
  }

  const categoryDetails = [
    { name: 'Mountain View Balcony', slug: 'mountain-view-balcony', description: 'Experience the best mountain views with a private balcony.', price: 5000, capacity: 2, type: 'Deluxe', count: 10, startRoom: 101 },
    { name: 'Mountain Room', slug: 'mountain-room', description: 'A cozy room facing the beautiful mountains.', price: 4000, capacity: 2, type: 'Standard', count: 10, startRoom: 201 },
    { name: 'Attic Suite', slug: 'attic-suite', description: 'Luxurious stay in the attic with unmatched comfort.', price: 8000, capacity: 4, type: 'Suite', count: 5, startRoom: 301 }
  ];

  // The request says "Mountain ,View Balcony, Attic Suite" - I will create:
  // 1. Mountain View
  // 2. View Balcony
  // 3. Attic Suite
  const actualCategories = [
    { name: 'Mountain', slug: 'mountain', description: 'Experience the serenity of the mountains.', price: 5000, capacity: 2, type: 'Standard', count: 10, startRoom: 101, code: 'MNT' },
    { name: 'View Balcony', slug: 'view-balcony', description: 'Enjoy unmatched comfort with a scenic balcony view.', price: 6000, capacity: 2, type: 'Deluxe', count: 10, startRoom: 201, code: 'VBAL' },
    { name: 'Attic Suite', slug: 'attic-suite', description: 'Luxurious Stay, Unmatched Comfort in our top-floor suite.', price: 8000, capacity: 4, type: 'Suite', count: 5, startRoom: 301, code: 'ATTC' }
  ];

  for (const cat of actualCategories) {
    // 1. Create WebsiteRoom
    const websiteRoom = await prisma.websiteRoom.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: cat.slug,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        price: cat.price,
        capacity: cat.capacity,
        type: cat.type,
        isActive: true,
        updatedAt: new Date(),
      }
    });

    // 2. Create RoomType
    const roomType = await prisma.roomType.create({
      data: {
        id: randomUUID(),
        propertyId: property.id,
        name: cat.name,
        code: cat.code,
        baseRate: cat.price,
        maxOccupancy: cat.capacity
      }
    });

    // 3. Create Physical Rooms
    for (let i = 0; i < cat.count; i++) {
      const roomNum = (cat.startRoom + i).toString();
      await prisma.room.create({
        data: {
          id: randomUUID(),
          propertyId: property.id,
          roomTypeId: roomType.id,
          roomNumber: roomNum,
          floor: roomNum[0], // First digit as floor
          status: 'AVAILABLE',
          housekeepingStatus: 'CLEAN',
        }
      });
    }
  }

  console.log('Successfully created WebsiteRooms, RoomTypes, and 25 physical Rooms.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
