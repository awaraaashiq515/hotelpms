import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CAFE_DATA = [
  {
    category: 'Hot Coffees',
    description: 'Freshly brewed aromatic hot coffee beverages',
    products: [
      { name: 'Espresso Solo', price: 120, description: 'Single shot of rich espresso.' },
      { name: 'Classic Cappuccino', price: 150, description: 'Espresso with steamed milk and deep layer of foam.' },
      { name: 'Cafe Latte', price: 160, description: 'Espresso with steamed milk and a light layer of foam.' },
      { name: 'Cafe Mocha', price: 180, description: 'Espresso with dark chocolate sauce, steamed milk, and whipped cream.' }
    ]
  },
  {
    category: 'Cold Coffees',
    description: 'Chilled coffee blends and brews to refresh you',
    products: [
      { name: 'Iced Latte', price: 170, description: 'Espresso, milk, and sweet syrup poured over ice.' },
      { name: 'Caramel Frappe', price: 210, description: 'Blended coffee, milk, caramel syrup, and crushed ice, topped with whipped cream.' },
      { name: 'Hazelnut Cold Coffee', price: 190, description: 'Creamy blended cold coffee infused with sweet hazelnut flavor.' },
      { name: 'Signature Cold Brew', price: 160, description: 'Slow-steeped cold brew served black or with milk.' }
    ]
  },
  {
    category: 'Special Teas',
    description: 'Traditional and herbal tea infusions',
    products: [
      { name: 'Masala Chai', price: 80, description: 'Aromatic tea brewed with milk and a blend of spices.' },
      { name: 'Organic Green Tea', price: 100, description: 'Steeped premium organic green tea leaves.' },
      { name: 'Peach Iced Tea', price: 130, description: 'Sweet peach flavored black iced tea with lemon slice.' },
      { name: 'Lemon Mint Ice Tea', price: 120, description: 'Refreshing iced tea with fresh lemon juice and fresh mint.' }
    ]
  },
  {
    category: 'Smoothies & Shakes',
    description: 'Thick, creamy fruit smoothies and milkshakes',
    products: [
      { name: 'Mango Smoothie', price: 180, description: 'Thick blend of sweet mangoes and yogurt.' },
      { name: 'Strawberry Shake', price: 190, description: 'Creamy milkshake made with fresh strawberries and ice cream.' },
      { name: 'Double Chocolate Shake', price: 200, description: 'Rich chocolate milkshake topped with chocolate chips.' },
      { name: 'Oreo Cookie Shake', price: 210, description: 'Vanilla milkshake blended with crunchy Oreo cookies.' }
    ]
  },
  {
    category: 'Breakfast Platters',
    description: 'Start your day with our signature breakfast items',
    products: [
      { name: 'Classic Pancakes', price: 190, description: 'Three fluffy pancakes served with maple syrup and butter.' },
      { name: 'Belgian Waffles', price: 220, description: 'Freshly baked golden waffle topped with powdered sugar.' },
      { name: 'French Toast', price: 170, description: 'Thick slices of bread dipped in egg mixture and pan-fried.' },
      { name: 'Veg Club Breakfast', price: 240, description: 'Includes grilled vegetables, hashbrowns, baked beans, and toast.' }
    ]
  },
  {
    category: 'Sandwiches & Wraps',
    description: 'Freshly prepared hot sandwiches and wraps',
    products: [
      { name: 'Grilled Cheese Sandwich', price: 150, description: 'Classic toasted sandwich loaded with melted cheese.' },
      { name: 'Veg Paneer Wrap', price: 170, description: 'Spiced cottage cheese and veggies wrapped in a soft tortilla.' },
      { name: 'Corn & Spinach Sandwich', price: 160, description: 'Creamy spinach and sweet corn filling grilled between bread slices.' },
      { name: 'Classic Veg Burger', price: 140, description: 'Crispy vegetable patty with lettuce, tomato, and mayo.' }
    ]
  },
  {
    category: 'Bakery & Pastries',
    description: 'Freshly baked pastries and treats',
    products: [
      { name: 'Butter Croissant', price: 110, description: 'Flaky, buttery French puff pastry.' },
      { name: 'Blueberry Muffin', price: 120, description: 'Soft, moist muffin packed with blueberries.' },
      { name: 'Fudgy Chocolate Brownie', price: 130, description: 'Rich, dense chocolate brownie.' },
      { name: 'Red Velvet Pastry', price: 140, description: 'Soft red velvet sponge cake layered with cream cheese frosting.' }
    ]
  },
  {
    category: 'Sides & Snacks',
    description: 'Perfect companions for your hot or cold brews',
    products: [
      { name: 'Classic French Fries', price: 120, description: 'Crispy salted potato fries.' },
      { name: 'Peri Peri Fries', price: 140, description: 'Crispy fries dusted with spicy peri peri seasoning.' },
      { name: 'Cheese Garlic Bread', price: 150, description: 'Toasted baguette slices with garlic butter and melted cheese.' },
      { name: 'Loaded Nachos', price: 180, description: 'Corn tortilla chips topped with cheese sauce, salsa, and jalapenos.' }
    ]
  },
  {
    category: 'Mocktails & Coolers',
    description: 'Fizzy, refreshing non-alcoholic cold coolers',
    products: [
      { name: 'Virgin Mojito', price: 140, description: 'Classic mix of lime juice, mint leaves, sugar, and soda over ice.' },
      { name: 'Blue Lagoon Cooler', price: 150, description: 'Vibrant blue curaçao syrup mixed with lemonade and soda.' },
      { name: 'Fresh Lime Soda', price: 90, description: 'Simple, fizzy, sweet and salted lime juice drink.' },
      { name: 'Watermelon Mint Cooler', price: 140, description: 'Fresh watermelon juice mixed with a hint of mint and lime.' }
    ]
  },
  {
    category: 'Desserts',
    description: 'Indulgent sweet treats to end your meal',
    products: [
      { name: 'Choco Lava Cake', price: 130, description: 'Warm chocolate cake with a gooey liquid chocolate center.' },
      { name: 'New York Cheesecake', price: 210, description: 'Rich and creamy classic baked cheesecake.' },
      { name: 'Sizzling Brownie', price: 240, description: 'Fudgy brownie on a hot plate topped with vanilla ice cream and hot chocolate sauce.' },
      { name: 'Vanilla Ice Cream Scoop', price: 80, description: 'Two scoops of premium vanilla bean ice cream.' }
    ]
  }
];

async function main() {
  console.log('Fetching properties...');
  const properties = await prisma.property.findMany();
  if (properties.length === 0) {
    console.log('No properties found to seed.');
    return;
  }

  console.log(`Found ${properties.length} properties. Upserting CAFE categories and products...`);

  let categoriesCount = 0;
  let productsCount = 0;

  for (const property of properties) {
    console.log(`Processing property: ${property.name} (${property.code})`);
    
    for (let i = 0; i < CAFE_DATA.length; i++) {
      const catData = CAFE_DATA[i];
      
      // Find or create Category
      let category = await prisma.category.findFirst({
        where: {
          name: catData.category,
          propertyId: property.id,
          menuType: 'CAFE'
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: catData.category,
            description: catData.description,
            propertyId: property.id,
            menuType: 'CAFE',
            isActive: true,
            displayOrder: i + 1,
          }
        });
      } else {
        // Update category display order and description just in case
        category = await prisma.category.update({
          where: { id: category.id },
          data: {
            description: catData.description,
            displayOrder: i + 1,
            isActive: true
          }
        });
      }
      categoriesCount++;

      // Create/Update Products under this category
      for (const prodData of catData.products) {
        let product = await prisma.product.findFirst({
          where: {
            name: prodData.name,
            categoryId: category.id,
            propertyId: property.id,
            menuType: 'CAFE'
          }
        });

        if (!product) {
          await prisma.product.create({
            data: {
              name: prodData.name,
              description: prodData.description,
              categoryId: category.id,
              propertyId: property.id,
              menuType: 'CAFE',
              productType: 'REVENUE',
              sellingPrice: prodData.price,
              costPrice: Math.round(prodData.price * 0.35),
              taxRate: 5,
              taxType: 'EXCLUSIVE',
              isActive: true,
              isVeg: true,
            }
          });
        } else {
          // Update product details if it exists to keep database updated
          await prisma.product.update({
            where: { id: product.id },
            data: {
              description: prodData.description,
              sellingPrice: prodData.price,
              costPrice: Math.round(prodData.price * 0.35),
              isActive: true,
              isVeg: true,
            }
          });
        }
        productsCount++;
      }
    }
  }

  console.log(`Successfully upserted ${categoriesCount} categories and ${productsCount} products!`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
