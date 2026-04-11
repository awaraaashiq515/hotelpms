const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const propertyId = 'cmnfz7gms001bhef1i5muffo0';
  const categories = {
    starters: 'cmnfz7grj001phef14zi3l9yv',
    mainCourse: 'cmnfz7gry001rhef19ydujykl',
    beverages: 'cmnfz7gsg001thef1uiv4q96n'
  };

  const products = [
    { name: 'Paneer Tikka', categoryId: categories.starters, price: 220 },
    { name: 'Veg Seekh Kebab', categoryId: categories.starters, price: 180 },
    { name: 'Dal Makhani', categoryId: categories.mainCourse, price: 250 },
    { name: 'Butter Paneer', categoryId: categories.mainCourse, price: 280 },
    { name: 'Mix Veg', categoryId: categories.mainCourse, price: 240 },
    { name: 'Tandoori Roti', categoryId: categories.mainCourse, price: 20 },
    { name: 'Butter Naan', categoryId: categories.mainCourse, price: 40 },
    { name: 'Sweet Lassi', categoryId: categories.beverages, price: 60 },
    { name: 'Masala Chai', categoryId: categories.beverages, price: 25 },
  ];

  console.log('Adding demo products for Ashoka Dhaba...');

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        propertyId: propertyId,
        categoryId: p.categoryId,
        sellingPrice: p.price,
        productType: 'REVENUE',
        isActive: true,
        availabilityStatus: true,
        trackInventory: false
      }
    });
    console.log(`Added: ${p.name}`);
  }

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
