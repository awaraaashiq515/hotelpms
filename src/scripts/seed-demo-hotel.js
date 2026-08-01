const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDemoHotel() {
  try {
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'Demo Hospitality Group' },
      });
    }

    let prop = await prisma.property.findFirst();
    if (!prop) {
      prop = await prisma.property.create({
        data: {
          organizationId: org.id,
          name: 'Grand Palace Hotel & Resort',
          code: 'GPH-01',
          type: 'HOTEL',
          city: 'Mandi',
          state: 'Himachal Pradesh',
          country: 'India',
          address: 'Mall Road, Mandi, HP',
          starRating: 4,
          hotelCategory: 'LUXURY',
          phone: '+91 9876543210',
          checkInTime: '12:00 PM',
          checkOutTime: '11:00 AM',
          breakfastTimings: '07:30 AM - 10:30 AM',
          poolTimings: '06:00 AM - 08:00 PM',
          gymTimings: '06:00 AM - 10:00 PM',
        },
      });
      console.log('Created Demo Property:', prop.name);
    }

    const roomTypesData = [
      { name: 'Deluxe Room', code: 'DLX', baseRate: 3500, maxOccupancy: 2 },
      { name: 'Executive Suite', code: 'STE', baseRate: 6500, maxOccupancy: 3 },
      { name: 'Presidential Suite', code: 'PRE', baseRate: 12000, maxOccupancy: 4 },
    ];

    for (const rt of roomTypesData) {
      let existingRt = await prisma.roomType.findFirst({
        where: { propertyId: prop.id, name: rt.name },
      });
      if (!existingRt) {
        existingRt = await prisma.roomType.create({
          data: { ...rt, propertyId: prop.id },
        });
      }

      const floors = ['1', '2', '3'];
      for (const floor of floors) {
        for (let r = 1; r <= 3; r++) {
          const roomNum = floor + '0' + r;
          const roomExist = await prisma.room.findFirst({
            where: { propertyId: prop.id, roomNumber: roomNum },
          });
          if (!roomExist) {
            await prisma.room.create({
              data: {
                propertyId: prop.id,
                roomTypeId: existingRt.id,
                roomNumber: roomNum,
                floor: floor,
                status: r === 1 ? 'AVAILABLE' : r === 2 ? 'OCCUPIED' : 'AVAILABLE',
                housekeepingStatus: 'CLEAN',
                isVIP: r === 3,
              },
            });
          }
        }
      }
    }
    console.log('Demo hotel & rooms created successfully!');
  } catch (e) {
    console.error('Error seeding demo hotel:', e);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoHotel();
