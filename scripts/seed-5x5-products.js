const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MENU_DATA = [
  {
    categoryName: 'Breakfast & Snacks',
    menuType: 'RESTAURANT',
    products: [
      {
        name: 'Masala Chai',
        sellingPrice: 30,
        costPrice: 8,
        description: 'Freshly brewed aromatic tea infused with ginger, cardamom and whole spices',
        isVeg: true,
        mealTimes: 'BREAKFAST,SNACKS',
        sku: 'BRK-001'
      },
      {
        name: 'Filter Coffee',
        sellingPrice: 50,
        costPrice: 15,
        description: 'Traditional South Indian frothy filter coffee brewed with fresh chicory blend',
        isVeg: true,
        mealTimes: 'BREAKFAST,SNACKS',
        sku: 'BRK-002'
      },
      {
        name: 'Aloo Paratha with Curd & Pickle',
        sellingPrice: 120,
        costPrice: 35,
        description: 'Two golden stuffed parathas served with butter, fresh dahi and tangy mixed pickle',
        isVeg: true,
        mealTimes: 'BREAKFAST,LUNCH',
        sku: 'BRK-003'
      },
      {
        name: 'Veg Club Sandwich with Fries',
        sellingPrice: 150,
        costPrice: 45,
        description: 'Triple decker toasted sandwich layered with cucumber, tomato, cheese and crispy potato chips',
        isVeg: true,
        mealTimes: 'BREAKFAST,SNACKS',
        sku: 'BRK-004'
      },
      {
        name: 'Poha with Sev & Roasted Peanuts',
        sellingPrice: 90,
        costPrice: 22,
        description: 'Steamed flattened rice tempered with mustard seeds, curry leaves, onions and crunchy peanuts',
        isVeg: true,
        mealTimes: 'BREAKFAST',
        sku: 'BRK-005'
      }
    ]
  },
  {
    categoryName: 'North Indian & Main Course',
    menuType: 'RESTAURANT',
    products: [
      {
        name: 'Paneer Butter Masala',
        sellingPrice: 280,
        halfPrice: 160,
        costPrice: 90,
        description: 'Succulent cubes of fresh paneer simmered in rich buttery tomato and cashew gravy',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'MAIN-001'
      },
      {
        name: 'Dal Makhani',
        sellingPrice: 240,
        halfPrice: 140,
        costPrice: 70,
        description: 'Black lentils slow cooked overnight with butter, cream and gentle spices',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'MAIN-002'
      },
      {
        name: 'Kadhai Chicken',
        sellingPrice: 340,
        halfPrice: 200,
        costPrice: 120,
        description: 'Tender chicken pieces cooked in a spicy onion-tomato gravy with bell peppers and coriander seeds',
        isVeg: false,
        mealTimes: 'LUNCH,DINNER',
        sku: 'MAIN-003'
      },
      {
        name: 'Butter Naan',
        sellingPrice: 45,
        costPrice: 12,
        description: 'Soft tandoori leavened flatbread brushed with generous salted butter',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'MAIN-004'
      },
      {
        name: 'Jeera Rice',
        sellingPrice: 140,
        halfPrice: 80,
        costPrice: 35,
        description: 'Fragrant aged Basmati rice tempered with cumin seeds and pure desi ghee',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'MAIN-005'
      }
    ]
  },
  {
    categoryName: 'Chinese & Fast Food',
    menuType: 'RESTAURANT',
    products: [
      {
        name: 'Veg Hakka Noodles',
        sellingPrice: 160,
        halfPrice: 100,
        costPrice: 40,
        description: 'Wok tossed noodles with shredded cabbage, capsicum, carrots, spring onions and light soy',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER,SNACKS',
        sku: 'CHN-001'
      },
      {
        name: 'Chilli Paneer Dry',
        sellingPrice: 220,
        halfPrice: 130,
        costPrice: 65,
        description: 'Crisp batter-fried paneer cubes tossed with green chillies, garlic, peppers and dark soy sauce',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER,SNACKS',
        sku: 'CHN-002'
      },
      {
        name: 'Chicken Fried Rice',
        sellingPrice: 210,
        halfPrice: 120,
        costPrice: 60,
        description: 'Long grain rice stir fried in a fiery wok with scrambled egg, shredded chicken and scallions',
        isVeg: false,
        mealTimes: 'LUNCH,DINNER',
        sku: 'CHN-003'
      },
      {
        name: 'Crispy Corn Salt & Pepper',
        sellingPrice: 170,
        costPrice: 45,
        description: 'Crunchy sweet corn kernels seasoned with cracked black pepper, sea salt and scallions',
        isVeg: true,
        mealTimes: 'SNACKS,DINNER',
        sku: 'CHN-004'
      },
      {
        name: 'Veg Spring Rolls (6 Pcs)',
        sellingPrice: 150,
        costPrice: 40,
        description: 'Crispy golden rolls filled with glass noodles and shredded vegetables, served with sweet chilli dip',
        isVeg: true,
        mealTimes: 'SNACKS,DINNER',
        sku: 'CHN-005'
      }
    ]
  },
  {
    categoryName: 'Beverages & Water',
    menuType: 'RESTAURANT',
    products: [
      {
        name: 'Mineral Water Bottle 1L',
        sellingPrice: 30,
        costPrice: 12,
        description: 'Packaged natural drinking water bottle sealed and chilled',
        isVeg: true,
        mealTimes: 'ALL',
        sku: 'BEV-001'
      },
      {
        name: 'Fresh Lime Soda (Sweet/Salt)',
        sellingPrice: 70,
        costPrice: 15,
        description: 'Refreshing carbonated drink with fresh lime juice, mint and choice of rock salt or sugar syrup',
        isVeg: true,
        mealTimes: 'ALL',
        sku: 'BEV-002'
      },
      {
        name: 'Cold Coffee with Ice Cream',
        sellingPrice: 120,
        costPrice: 35,
        description: 'Thick creamy blended coffee topped with a scoop of vanilla ice cream and chocolate drizzle',
        isVeg: true,
        mealTimes: 'ALL',
        sku: 'BEV-003'
      },
      {
        name: 'Sweet Punjabi Lassi',
        sellingPrice: 80,
        costPrice: 20,
        description: 'Traditional churned sweet yogurt drink served chilled with malai and dry fruit garnish',
        isVeg: true,
        mealTimes: 'LUNCH,SNACKS',
        sku: 'BEV-004'
      },
      {
        name: 'Soft Drink Can 300ml',
        sellingPrice: 50,
        costPrice: 28,
        description: 'Chilled soda can (Coke / Sprite / Thums Up)',
        isVeg: true,
        mealTimes: 'ALL',
        sku: 'BEV-005'
      }
    ]
  },
  {
    categoryName: 'Desserts & Sweets',
    menuType: 'RESTAURANT',
    products: [
      {
        name: 'Gulab Jamun (2 Pcs)',
        sellingPrice: 80,
        costPrice: 20,
        description: 'Warm soft khoya dumplings soaked in fragrant cardamom and saffron rose syrup',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'DES-001'
      },
      {
        name: 'Hot Sizzling Brownie with Ice Cream',
        sellingPrice: 160,
        costPrice: 45,
        description: 'Warm fudgy chocolate brownie topped with vanilla bean ice cream and hot chocolate fudge',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'DES-002'
      },
      {
        name: 'Rasgulla (2 Pcs)',
        sellingPrice: 80,
        costPrice: 20,
        description: 'Spongy cottage cheese balls soaked in light sugar syrup served chilled',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'DES-003'
      },
      {
        name: 'Kulfi Falooda Royal',
        sellingPrice: 110,
        costPrice: 30,
        description: 'Traditional malai kulfi served on a bed of chilled falooda noodles, rabri and rose syrup',
        isVeg: true,
        mealTimes: 'LUNCH,DINNER',
        sku: 'DES-004'
      },
      {
        name: 'Vanilla / Chocolate Ice Cream Scoop',
        sellingPrice: 60,
        costPrice: 18,
        description: 'Rich creamy double scoop of gourmet ice cream',
        isVeg: true,
        mealTimes: 'ALL',
        sku: 'DES-005'
      }
    ]
  }
];

async function seedProperties(targetPropertyCodes) {
  for (const code of targetPropertyCodes) {
    const prop = await prisma.property.findFirst({
      where: {
        OR: [{ code }, { code: code.toUpperCase() }, { code: code.toLowerCase() }]
      }
    });

    if (!prop) {
      console.log(`Property code ${code} not found, skipping.`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`Seeding 5x5 Products for: ${prop.name} (Code: ${prop.code}, ID: ${prop.id})`);

    // Find or create an outlet for this property
    let outlet = await prisma.outlet.findFirst({ where: { propertyId: prop.id } });
    if (!outlet) {
      outlet = await prisma.outlet.create({
        data: {
          propertyId: prop.id,
          name: prop.type === 'HOTEL' ? 'Main Hotel Kitchen' : 'Main Dining Outlet',
          type: prop.type === 'HOTEL' ? 'HOTEL' : 'RESTAURANT',
        }
      });
      console.log(`Created outlet ${outlet.name}`);
    }

    let addedCount = 0;

    for (const catData of MENU_DATA) {
      // Find or create Category
      let category = await prisma.category.findFirst({
        where: {
          propertyId: prop.id,
          name: catData.categoryName
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            propertyId: prop.id,
            name: catData.categoryName,
            menuType: catData.menuType,
            isActive: true,
            displayOrder: 0
          }
        });
        console.log(`Created Category: "${category.name}"`);
      } else {
        console.log(`Category exists: "${category.name}"`);
      }

      // Add 5 products under this category
      for (const prodData of catData.products) {
        // Check if product already exists
        const existing = await prisma.product.findFirst({
          where: {
            propertyId: prop.id,
            name: prodData.name
          }
        });

        if (!existing) {
          await prisma.product.create({
            data: {
              propertyId: prop.id,
              categoryId: category.id,
              outletId: outlet.id,
              name: prodData.name,
              sku: `${prop.code.slice(0, 3)}-${prodData.sku}`,
              productType: 'REVENUE',
              costPrice: prodData.costPrice,
              sellingPrice: prodData.sellingPrice,
              halfPrice: prodData.halfPrice || null,
              taxRate: 5,
              taxType: 'EXCLUSIVE',
              menuType: 'RESTAURANT',
              isVeg: prodData.isVeg,
              mealTimes: prodData.mealTimes,
              description: prodData.description,
              isActive: true,
              availabilityStatus: true,
              trackInventory: false
            }
          });
          addedCount++;
          console.log(`  + Added: ${prodData.name} (₹${prodData.sellingPrice}${prodData.halfPrice ? `, Half: ₹${prodData.halfPrice}` : ''})`);
        } else {
          console.log(`  = Already exists: ${prodData.name}`);
        }
      }
    }

    const totalProd = await prisma.product.count({ where: { propertyId: prop.id } });
    console.log(`Total products for ${prop.code}: ${totalProd} (Added: ${addedCount})`);
  }
}

async function main() {
  // Seed for both hotel and restaurant branches
  await seedProperties(['RST-0987', 'HTL12345', 'HTL0123', 'RST098']);
}

main()
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

