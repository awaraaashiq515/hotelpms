import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany();
  console.log('Properties:', properties.map(p => ({ id: p.id, name: p.name })));
  
  const roomTypes = await prisma.roomType.findMany();
  console.log('RoomTypes:', roomTypes.map(rt => ({ id: rt.id, name: rt.name })));
  
  const rooms = await prisma.room.findMany();
  console.log('Total Rooms:', rooms.length);
  
  const websiteRooms = await prisma.websiteRoom.findMany();
  console.log('WebsiteRooms:', websiteRooms.map(wr => ({ id: wr.id, name: wr.name })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
