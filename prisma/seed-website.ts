import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Default Settings
  await prisma.websiteSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      hotelName: 'Avasa Hotels',
      address: 'SAJJANU VILLE, Simsa, MANALI, Manali, Himachal Pradesh 175131',
      email: 'Hotelsavasa@gmail.com',
      storyTitle: 'Our Story – The Story of Avasa Hotels',
      storyContent: 'Avasa Hotels represents the pinnacle of luxury and comfort in the heart of Manali. Our journey began with a vision to provide travelers with an unforgettable experience that combines modern amenities with traditional Himachali hospitality.',
      mapIframe: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3393.18731362626!2d77.1866!3d32.2396!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCDE0nMjIuNiJOIDc3wrAxMScxMS44IkU!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin',
    },
  });

  // 2. Hero Sliders
  const sliders = [
    {
      section: 'HERO',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000',
      title: 'Luxury Meets Nature',
      subtitle: 'Experience the best of Manali at Avasa Hotels',
      order: 0,
    },
    {
      section: 'HERO',
      type: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=2000',
      title: 'Comfortable Rooms',
      subtitle: 'Your home away from home',
      order: 1,
    },
  ];

  for (const s of sliders) {
    await prisma.websiteSlider.create({ data: s });
  }

  // 3. Experiences
  const experiences = [
    {
      title: 'Rohtang Pass',
      description: 'This magical white landscape is calling your inner child to come and rejoice.',
      imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=1000',
      order: 0,
    },
    {
      title: 'Hadimba Temple',
      description: 'Built in 1553, Hadimba Temple is an ancient temple dedicated to Hidimbi Devi.',
      imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=1000',
      order: 1,
    },
    {
      title: 'Solang Valley',
      description: 'Lush green during the summers and a blanket of snow in winter, you don\'t wanna miss this.',
      imageUrl: 'https://images.unsplash.com/photo-1605649440419-44fbc96ae302?auto=format&fit=crop&q=80&w=1000',
      order: 2,
    },
  ];

  for (const e of experiences) {
    await prisma.websiteExperience.create({ data: e });
  }

  // 4. Room Demos
  const rooms = [
    {
      name: 'Deluxe Room',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000',
      order: 0,
    },
    {
      name: 'Super Deluxe Room',
      price: 6500,
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1000',
      order: 1,
    },
  ];

  for (const r of rooms) {
    const { image, ...roomData } = r;
    await prisma.websiteRoom.create({ 
      data: {
        ...roomData,
        slug: r.name.toLowerCase().replace(/\s+/g, '-'),
        description: r.name,
        capacity: 2,
        type: 'Deluxe',
        images: {
          create: [
            { url: image, order: 0 }
          ]
        }
      }
    });
  }

  console.log('Website seeding completed!');
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
