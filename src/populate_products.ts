import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROPERTY_ID = 'cmn4kpl5u00024rg3wg2rbib8';
const CATEGORY_ID = 'cmn4kpl7400064rg3u4nhl20m';

const foodItems = [
  'Butter Chicken', 'Paneer Butter Masala', 'Garlic Naan', 'Dal Makhani', 'Jeera Rice',
  'Chicken Biryani', 'Veg Biryani', 'Cold Drink (Coke)', 'Mineral Water', 'Masala Dosa',
  'Idli (2 Pcs)', 'Chole Bhature', 'Aloo Paratha', 'Samosa (2 Pcs)', 'Tea',
  'Coffee', 'Lassi', 'Gulab Jamun', 'Rasgulla', 'Ice Cream (Vanilla)',
  'Spring Roll', 'Manchurian', 'Hakka Noodles', 'Fried Rice', 'Momos (6 Pcs)',
  'Pasta Alfredo', 'White Sauce Pasta', 'Burger (Veg)', 'Cheese Sandwich', 'French Fries',
  'Pizza Margherita', 'Paneer Tikka', 'Tandoori Roti', 'Butter Naan', 'Raita',
  'Papad (2 Pcs)', 'Fish Curry', 'Prawn Masala', 'Mutton Rogan Josh', 'Egg Curry',
  'Dahi Bhalla', 'Pav Bhaji', 'Bhel Puri', 'Gol Gappa (6 Pcs)', 'Alu Tikki',
  'Kadhai Paneer', 'Malai Kofta', 'Shahi Paneer', 'Mix Veg', 'Baingan Bharta'
];

async function main() {
  console.log('Adding 50 demo products with HSN numbers...');
  
  const entries = foodItems.map((item, index) => {
    return {
      propertyId: PROPERTY_ID,
      categoryId: CATEGORY_ID,
      name: item,
      sellingPrice: 50 + (index * 10),
      hsnCode: '21069099',
      productType: 'VEG',
      isActive: true,
      costPrice: 20 + (index * 4),
      availabilityStatus: true,
    }
  });

  const created = await prisma.product.createMany({
    data: entries,
  });

  console.log(`Successfully added ${created.count} products to Property: ${PROPERTY_ID}`);
  await prisma.$disconnect();
}

main().catch(console.error);
