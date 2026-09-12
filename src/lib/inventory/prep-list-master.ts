/**
 * Master Restaurant Prep Catalog
 * Automatically parsed & structured from Restaurant_Prep_List_Full.xlsx
 *
 * - Total Dishes: 180
 * - Total Culinary Categories: 13
 * - Total Unique Raw Stock Items: 178
 * - Total Recipe Ingredient Mappings: 1648
 */

export interface PrepIngredient {
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
}

export interface PrepDish {
  sNo: number;
  category: string;
  dishName: string;
  sellingPrice: number;
  costPrice: number;
  isVeg: boolean;
  patternStr: string;
  ingredients: PrepIngredient[];
}

export interface PrepRawMaterial {
  name: string;
  unit: string;
  openingStock: number;
  minimumStock: number;
  reorderLevel: number;
  costPrice: number;
}

export const PREP_CATEGORIES: string[] = [
  "Indian Breads (Tandoor & Tawa)",
  "Breakfast & Street Food Specialties",
  "Starters & Appetizers (Veg)",
  "Starters & Appetizers (Non-Veg)",
  "Main Course — Vegetarian",
  "Main Course — Non-Vegetarian",
  "Rice, Pulao & Biryani",
  "Indo-Chinese & Asian",
  "Soups",
  "Continental, Burgers, Pizzas & Pastas",
  "Salads, Raita & Accompaniments",
  "Desserts & Sweets",
  "Beverages, Shakes & Mocktails (Non-Alcoholic)"
];

export const PREP_RAW_MATERIALS: PrepRawMaterial[] = [
  {
    "name": "Maida",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 35
  },
  {
    "name": "Butter",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 450
  },
  {
    "name": "Milk",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 60
  },
  {
    "name": "Salt",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 20
  },
  {
    "name": "Baking Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 120
  },
  {
    "name": "Garlic",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Cheese",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 420
  },
  {
    "name": "Refined Oil",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 130
  },
  {
    "name": "Atta",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Spices",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 10
  },
  {
    "name": "Besan / Dal Chana",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 75
  },
  {
    "name": "Onion",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 30
  },
  {
    "name": "Green Chilli",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 60
  },
  {
    "name": "Ginger (Chopped)",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 180
  },
  {
    "name": "Coriander Leaves (Chopped)",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 50
  },
  {
    "name": "Cumin Seeds",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 250
  },
  {
    "name": "Ajwain / Carom Seeds",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 240
  },
  {
    "name": "Garam Masala",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 350
  },
  {
    "name": "Amchur / Dry Mango Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 220
  },
  {
    "name": "Red Chilli Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Refined Oil (for roasting)",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 130
  },
  {
    "name": "Potato/Paneer",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 320
  },
  {
    "name": "Green Chilli (Chopped)",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 60
  },
  {
    "name": "Curd",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Baking Soda",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 120
  },
  {
    "name": "Chole",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 110
  },
  {
    "name": "Tomato",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Ginger",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 180
  },
  {
    "name": "Potato",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 25
  },
  {
    "name": "Mustard Oil",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 150
  },
  {
    "name": "Turmeric",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 180
  },
  {
    "name": "Paneer",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 320
  },
  {
    "name": "Cauliflower",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Poha",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 55
  },
  {
    "name": "Curry Leaves",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Turmeric Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 180
  },
  {
    "name": "Coriander Leaves (Garnish)",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 50
  },
  {
    "name": "Asafoetida / Hing",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 600
  },
  {
    "name": "Lemon Juice",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 80
  },
  {
    "name": "Sooji Semolina",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 45
  },
  {
    "name": "Ghee",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 550
  },
  {
    "name": "Mustard Seeds",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Rice",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 60
  },
  {
    "name": "Dal Toor",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 120
  },
  {
    "name": "Dal Urad",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 110
  },
  {
    "name": "Capsicum",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 80
  },
  {
    "name": "Pav",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 5
  },
  {
    "name": "Eggs",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 7
  },
  {
    "name": "Bread",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 5
  },
  {
    "name": "Black Pepper Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 450
  },
  {
    "name": "Sugar",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 45
  },
  {
    "name": "Ginger-Garlic Paste",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Chaat Masala",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 250
  },
  {
    "name": "Kasuri Methi",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 300
  },
  {
    "name": "Besan / Gram Flour",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 75
  },
  {
    "name": "Fresh Cream",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 250
  },
  {
    "name": "Green Peas",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 80
  },
  {
    "name": "Spinach",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 35
  },
  {
    "name": "Carrot/Peas",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Mushroom",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 160
  },
  {
    "name": "Sweet Corn",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Maida/Cornflour",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 35
  },
  {
    "name": "Garlic (Chopped)",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Soya Sauce",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 90
  },
  {
    "name": "Cabbage/Carrot",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 35
  },
  {
    "name": "Cornflour",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Honey",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 100
  },
  {
    "name": "Chilli Sauce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 95
  },
  {
    "name": "Peri Peri Masala",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Chicken Whole",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Chicken Boneless",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 260
  },
  {
    "name": "Chicken Keema",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Cream",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 250
  },
  {
    "name": "Chicken Wings",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Soya/Chilli Sauce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 95
  },
  {
    "name": "Oil",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 130
  },
  {
    "name": "Fish Pomfret/Basa",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 400
  },
  {
    "name": "Besan",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 75
  },
  {
    "name": "Fish",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 400
  },
  {
    "name": "Prawns",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 400
  },
  {
    "name": "Mutton Keema",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 550
  },
  {
    "name": "Dal Chana",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 110
  },
  {
    "name": "Coriander Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 50
  },
  {
    "name": "Tomato/Onion Gravy",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 30
  },
  {
    "name": "Dal Masoor/Urad",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 110
  },
  {
    "name": "Cumin",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 250
  },
  {
    "name": "Refined Oil/Ghee",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 550
  },
  {
    "name": "Rajma",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 140
  },
  {
    "name": "Bhindi / Okra",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Brinjal / Eggplant",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Peas",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 80
  },
  {
    "name": "Mixed Veggies",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Cashews/Nuts",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 750
  },
  {
    "name": "Fennel",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Kashmiri Mirch",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Mustard/Refined Oil",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 130
  },
  {
    "name": "Chicken",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Mutton",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 550
  },
  {
    "name": "Fish Pomfret",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 400
  },
  {
    "name": "Coconut Milk / Cream",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 250
  },
  {
    "name": "Basmati Rice",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 90
  },
  {
    "name": "Biryani Masala",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 400
  },
  {
    "name": "Whole Garam Masala (Bay Leaf, Cinnamon, Cloves, Cardamom, Star Anise)",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 1800
  },
  {
    "name": "Mint Leaves",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 50
  },
  {
    "name": "Coriander Leaves",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 50
  },
  {
    "name": "Fried Onion / Birista",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 30
  },
  {
    "name": "Saffron Milk",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 60
  },
  {
    "name": "Peas/Carrot",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Whole Spices (Bay Leaf, Cinnamon, Cloves)",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 900
  },
  {
    "name": "Carrot/Potato",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 25
  },
  {
    "name": "Dal Moong",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 120
  },
  {
    "name": "Carrot",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Spring Onion",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 30
  },
  {
    "name": "Vinegar",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 40
  },
  {
    "name": "Red Chilli Sauce",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 200
  },
  {
    "name": "Veggies",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Schezwan Sauce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 95
  },
  {
    "name": "Noodles",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Cabbage/Carrot/Capsicum",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 80
  },
  {
    "name": "Veg Balls",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Chicken Keema Balls",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Fried Noodles",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Lemon",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 4
  },
  {
    "name": "Coriander",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 50
  },
  {
    "name": "Pepper",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 450
  },
  {
    "name": "Burger Bun",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 5
  },
  {
    "name": "Veg Patty",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Lettuce/Tomato",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Mayonnaise/Sauce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 140
  },
  {
    "name": "Oregano",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Chilli Flakes",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Chicken Patty",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 200
  },
  {
    "name": "Potato/Cucumber/Tomato",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 25
  },
  {
    "name": "Green Chutney",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Cucumber/Tomato/Lettuce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Pizza Base",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 25
  },
  {
    "name": "Pizza Sauce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 90
  },
  {
    "name": "Cheese Mozzarella",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 450
  },
  {
    "name": "Chicken Tikka/BBQ",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 260
  },
  {
    "name": "Pasta",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Tomato Sauce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 40
  },
  {
    "name": "Olive/Refined Oil",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 130
  },
  {
    "name": "Cucumber",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 30
  },
  {
    "name": "Roasted Cumin Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 250
  },
  {
    "name": "Curd / Yoghurt",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 70
  },
  {
    "name": "Boondi",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Roasted Cumin",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 250
  },
  {
    "name": "Pineapple",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Papad",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 100
  },
  {
    "name": "Khoya/Mix",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Green Cardamom Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 1800
  },
  {
    "name": "Saffron Strands",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 1500
  },
  {
    "name": "Chopped Almonds / Pistachio",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 800
  },
  {
    "name": "Chhena",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 320
  },
  {
    "name": "Nuts",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 850
  },
  {
    "name": "Ice Cream",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 250
  },
  {
    "name": "Brownie",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 100
  },
  {
    "name": "Chocolate Sauce",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 90
  },
  {
    "name": "Vanilla Ice Cream",
    "unit": "Scoop",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 250
  },
  {
    "name": "Tea Leaves",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 280
  },
  {
    "name": "Green Tea Bag",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 280
  },
  {
    "name": "Hot Water",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Coffee Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 450
  },
  {
    "name": "Ice Cubes",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 10
  },
  {
    "name": "Ice",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 10
  },
  {
    "name": "Cumin Powder",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 250
  },
  {
    "name": "Mango Pulp",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  },
  {
    "name": "Water",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 100
  },
  {
    "name": "Soda Water",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 35
  },
  {
    "name": "Sugar Syrup / Salt",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 20
  },
  {
    "name": "Tea",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 280
  },
  {
    "name": "Banana",
    "unit": "PC",
    "openingStock": 50,
    "minimumStock": 10,
    "reorderLevel": 20,
    "costPrice": 100
  },
  {
    "name": "Chocolate Syrup",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 180
  },
  {
    "name": "Strawberry Syrup",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 180
  },
  {
    "name": "Sugar Syrup",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 45
  },
  {
    "name": "Sprite",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 35
  },
  {
    "name": "Blue Curacao Syrup",
    "unit": "LTR",
    "openingStock": 25,
    "minimumStock": 5,
    "reorderLevel": 8,
    "costPrice": 180
  },
  {
    "name": "Direct Stock Item",
    "unit": "KG",
    "openingStock": 30,
    "minimumStock": 5,
    "reorderLevel": 10,
    "costPrice": 100
  }
];

export const PREP_DISHES: PrepDish[] = [
  {
    "sNo": 1,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Butter Naan",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Milk",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 13.3,
    "sellingPrice": 70,
    "isVeg": true,
    "patternStr": "Butter\\s+Naan"
  },
  {
    "sNo": 2,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Garlic Naan",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Milk",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Garlic",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 15.3,
    "sellingPrice": 85,
    "isVeg": true,
    "patternStr": "Garlic\\s+Naan"
  },
  {
    "sNo": 3,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Cheese Garlic Naan",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Cheese",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Garlic",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 26.7,
    "sellingPrice": 120,
    "isVeg": true,
    "patternStr": "Cheese\\s+Garlic\\s+Naan"
  },
  {
    "sNo": 4,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Plain Naan",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Milk",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Refined Oil",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 5.6,
    "sellingPrice": 60,
    "isVeg": true,
    "patternStr": "Plain\\s+Naan"
  },
  {
    "sNo": 5,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Tandoori Roti (Plain)",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 3.3,
    "sellingPrice": 25,
    "isVeg": true,
    "patternStr": "Tandoori\\s+Roti\\s+Plain"
  },
  {
    "sNo": 6,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Tandoori Butter Roti",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 7.8,
    "sellingPrice": 35,
    "isVeg": true,
    "patternStr": "Tandoori\\s+Butter\\s+Roti"
  },
  {
    "sNo": 7,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Tawa Roti",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.07,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 2.9,
    "sellingPrice": 25,
    "isVeg": true,
    "patternStr": "Tawa\\s+Roti"
  },
  {
    "sNo": 8,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Laccha Paratha",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.025,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 15.4,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Laccha\\s+Paratha"
  },
  {
    "sNo": 9,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Pudina Paratha",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Spices",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 10
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 13.2,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Pudina\\s+Paratha"
  },
  {
    "sNo": 10,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Missi Roti",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Besan / Dal Chana",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Green Chilli",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ajwain / Carom Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 240
      },
      {
        "name": "Garam Masala",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Amchur / Dry Mango Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 220
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Refined Oil (for roasting)",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      }
    ],
    "costPrice": 14.8,
    "sellingPrice": 50,
    "isVeg": true,
    "patternStr": "Missi\\s+Roti"
  },
  {
    "sNo": 11,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Stuffed Kulcha (Aloo / Onion / Paneer)",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Potato/Paneer",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chilli (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ajwain / Carom Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 240
      },
      {
        "name": "Garam Masala",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Amchur / Dry Mango Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 220
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Refined Oil (for roasting)",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      }
    ],
    "costPrice": 40.5,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Stuffed\\s+Kulcha\\s+Aloo|Onion|Paneer"
  },
  {
    "sNo": 12,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Roomali Roti",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Atta",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Milk",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 4.6,
    "sellingPrice": 50,
    "isVeg": true,
    "patternStr": "Roomali\\s+Roti"
  },
  {
    "sNo": 13,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Bhatura (2 Pcs)",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Curd",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Refined Oil",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Soda",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 11,
    "sellingPrice": 50,
    "isVeg": true,
    "patternStr": "Bhatura\\s+2\\s+Pcs"
  },
  {
    "sNo": 14,
    "category": "Indian Breads (Tandoor & Tawa)",
    "dishName": "Puri (4 Pcs)",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Soda",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 8.1,
    "sellingPrice": 60,
    "isVeg": true,
    "patternStr": "Puri\\s+4\\s+Pcs"
  },
  {
    "sNo": 15,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Chole Bhature / Chana Bhatura",
    "ingredients": [
      {
        "name": "Chole",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 110
      },
      {
        "name": "Maida",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.05,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Soda",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 36.1,
    "sellingPrice": 140,
    "isVeg": true,
    "patternStr": "Chole\\s+Bhature|Chana\\s+Bhatura"
  },
  {
    "sNo": 16,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Puri Bhaji (4 Pcs)",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Potato",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Onion",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Turmeric",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Baking Soda",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 120
      }
    ],
    "costPrice": 13.5,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Puri\\s+Bhaji\\s+4\\s+Pcs"
  },
  {
    "sNo": 17,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Aloo Paratha",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Potato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ajwain / Carom Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 240
      },
      {
        "name": "Garam Masala",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Amchur / Dry Mango Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 220
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Refined Oil (for roasting)",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      }
    ],
    "costPrice": 25.6,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Aloo\\s+Paratha"
  },
  {
    "sNo": 18,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Paneer Paratha",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Paneer",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chilli (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ajwain / Carom Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 240
      },
      {
        "name": "Garam Masala",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Amchur / Dry Mango Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 220
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Refined Oil (for roasting)",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      }
    ],
    "costPrice": 48.9,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Paneer\\s+Paratha"
  },
  {
    "sNo": 19,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Gobhi Paratha",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Cauliflower",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chilli (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ajwain / Carom Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 240
      },
      {
        "name": "Garam Masala",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Amchur / Dry Mango Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 220
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Refined Oil (for roasting)",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      }
    ],
    "costPrice": 27.3,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Gobhi\\s+Paratha"
  },
  {
    "sNo": 20,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Mix Veg Paratha",
    "ingredients": [
      {
        "name": "Atta",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Potato",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Paneer",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Cauliflower",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chilli (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Chopped)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ajwain / Carom Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 240
      },
      {
        "name": "Garam Masala",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Amchur / Dry Mango Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 220
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Refined Oil (for roasting)",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      }
    ],
    "costPrice": 35.1,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Mix\\s+Veg\\s+Paratha"
  },
  {
    "sNo": 21,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Poha",
    "ingredients": [
      {
        "name": "Poha",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 55
      },
      {
        "name": "Potato",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Onion",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Asafoetida / Hing",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 600
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 14,
    "sellingPrice": 80,
    "isVeg": true,
    "patternStr": "Poha"
  },
  {
    "sNo": 22,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Upma",
    "ingredients": [
      {
        "name": "Sooji Semolina",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Onion",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ghee",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Asafoetida / Hing",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 600
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 18.3,
    "sellingPrice": 80,
    "isVeg": true,
    "patternStr": "Upma"
  },
  {
    "sNo": 23,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Idli Sambhar (2 Pcs)",
    "ingredients": [
      {
        "name": "Rice",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Dal Toor",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 120
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Asafoetida / Hing",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 600
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 17.2,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Idli\\s+Sambhar\\s+2\\s+Pcs"
  },
  {
    "sNo": 24,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Medu Vada Sambhar (2 Pcs)",
    "ingredients": [
      {
        "name": "Dal Urad",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 110
      },
      {
        "name": "Dal Toor",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 120
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Asafoetida / Hing",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 600
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 21.8,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Medu\\s+Vada\\s+Sambhar\\s+2\\s+Pcs"
  },
  {
    "sNo": 25,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Plain Dosa",
    "ingredients": [
      {
        "name": "Rice",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Refined Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Asafoetida / Hing",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 600
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 13.5,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Plain\\s+Dosa"
  },
  {
    "sNo": 26,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Masala Dosa",
    "ingredients": [
      {
        "name": "Rice",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Potato",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Refined Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Asafoetida / Hing",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 600
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 15.8,
    "sellingPrice": 120,
    "isVeg": true,
    "patternStr": "Masala\\s+Dosa"
  },
  {
    "sNo": 27,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Pav Bhaji",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Capsicum",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Butter",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Pav",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Asafoetida / Hing",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 600
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 41.7,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Pav\\s+Bhaji"
  },
  {
    "sNo": 28,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Bread Omelette",
    "ingredients": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      }
    ],
    "costPrice": 27.5,
    "sellingPrice": 110,
    "isVeg": false,
    "patternStr": "Bread\\s+Omelette"
  },
  {
    "sNo": 29,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Scrambled Eggs / Bhurji",
    "ingredients": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Milk",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      }
    ],
    "costPrice": 23,
    "sellingPrice": 110,
    "isVeg": false,
    "patternStr": "Scrambled\\s+Eggs|Bhurji"
  },
  {
    "sNo": 30,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "Boiled Eggs (2 Pcs)",
    "ingredients": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      }
    ],
    "costPrice": 15,
    "sellingPrice": 110,
    "isVeg": false,
    "patternStr": "Boiled\\s+Eggs\\s+2\\s+Pcs"
  },
  {
    "sNo": 31,
    "category": "Breakfast & Street Food Specialties",
    "dishName": "French Toast",
    "ingredients": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Milk",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Sugar",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      }
    ],
    "costPrice": 20.8,
    "sellingPrice": 110,
    "isVeg": false,
    "patternStr": "French\\s+Toast"
  },
  {
    "sNo": 32,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Paneer Tikka",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Curd",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Capsicum",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 90.5,
    "sellingPrice": 260,
    "isVeg": true,
    "patternStr": "Paneer\\s+Tikka"
  },
  {
    "sNo": 33,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Paneer Malai Tikka",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Fresh Cream",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Cheese",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 108.5,
    "sellingPrice": 260,
    "isVeg": true,
    "patternStr": "Paneer\\s+Malai\\s+Tikka"
  },
  {
    "sNo": 34,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Hara Bhara Kebab",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Green Peas",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Spinach",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 21.7,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Hara\\s+Bhara\\s+Kebab"
  },
  {
    "sNo": 35,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Veg Seekh Kebab",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Paneer",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Carrot/Peas",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 30.2,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Veg\\s+Seekh\\s+Kebab"
  },
  {
    "sNo": 36,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Mushroom Tikka",
    "ingredients": [
      {
        "name": "Mushroom",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 160
      },
      {
        "name": "Curd",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 47.7,
    "sellingPrice": 210,
    "isVeg": true,
    "patternStr": "Mushroom\\s+Tikka"
  },
  {
    "sNo": 37,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Crispy Corn",
    "ingredients": [
      {
        "name": "Sweet Corn",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Maida/Cornflour",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Capsicum",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 33.5,
    "sellingPrice": 210,
    "isVeg": true,
    "patternStr": "Crispy\\s+Corn"
  },
  {
    "sNo": 38,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Veg Spring Rolls (4 Pcs)",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Cabbage/Carrot",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 16.1,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Veg\\s+Spring\\s+Rolls\\s+4\\s+Pcs"
  },
  {
    "sNo": 39,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Honey Chilli Potato",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Honey",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 100
      },
      {
        "name": "Refined Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Chilli Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 20.2,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Honey\\s+Chilli\\s+Potato"
  },
  {
    "sNo": 40,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "French Fries",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Refined Oil",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 18.7,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "French\\s+Fries"
  },
  {
    "sNo": 41,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Peri Peri Fries",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Refined Oil",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Peri Peri Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 19.2,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Peri\\s+Peri\\s+Fries"
  },
  {
    "sNo": 42,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Veg Manchurian Dry",
    "ingredients": [
      {
        "name": "Cabbage/Carrot",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 16.9,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Veg\\s+Manchurian\\s+Dry"
  },
  {
    "sNo": 43,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Chilli Paneer Dry",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Capsicum",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 74.7,
    "sellingPrice": 260,
    "isVeg": true,
    "patternStr": "Chilli\\s+Paneer\\s+Dry"
  },
  {
    "sNo": 44,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Cheese Balls (6 Pcs)",
    "ingredients": [
      {
        "name": "Cheese",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Potato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 46.8,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Cheese\\s+Balls\\s+6\\s+Pcs"
  },
  {
    "sNo": 45,
    "category": "Starters & Appetizers (Veg)",
    "dishName": "Samosa (2 Pcs)",
    "ingredients": [
      {
        "name": "Maida",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Potato",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 17,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Samosa\\s+2\\s+Pcs"
  },
  {
    "sNo": 46,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Tandoori Chicken (Half / Full)",
    "ingredients": [
      {
        "name": "Chicken Whole",
        "quantity": 0.45,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Curd",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 107.9,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Tandoori\\s+Chicken\\s+Half|Full"
  },
  {
    "sNo": 47,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chicken Tikka (6 Pcs)",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Curd",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 81.4,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+Tikka\\s+6\\s+Pcs"
  },
  {
    "sNo": 48,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chicken Malai Tikka",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Fresh Cream",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Cheese",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Curd",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 96.2,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+Malai\\s+Tikka"
  },
  {
    "sNo": 49,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chicken Seekh Kebab",
    "ingredients": [
      {
        "name": "Chicken Keema",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Onion",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 62.6,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+Seekh\\s+Kebab"
  },
  {
    "sNo": 50,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chicken Reshmi Kebab",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Cream",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 82.4,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+Reshmi\\s+Kebab"
  },
  {
    "sNo": 51,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chicken Lollipop (6 Pcs)",
    "ingredients": [
      {
        "name": "Chicken Wings",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Refined Oil",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Soya/Chilli Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 63,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+Lollipop\\s+6\\s+Pcs"
  },
  {
    "sNo": 52,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chicken Wings (BBQ / Crispy)",
    "ingredients": [
      {
        "name": "Chicken Wings",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Refined Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 61.8,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+Wings\\s+BBQ|Crispy"
  },
  {
    "sNo": 53,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chilli Chicken Dry",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Capsicum",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 73.9,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chilli\\s+Chicken\\s+Dry"
  },
  {
    "sNo": 54,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Chicken Manchurian Dry",
    "ingredients": [
      {
        "name": "Chicken Keema",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Refined Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 56.3,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+Manchurian\\s+Dry"
  },
  {
    "sNo": 55,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Amritsari Fish Fry",
    "ingredients": [
      {
        "name": "Fish Pomfret/Basa",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Besan",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 115.5,
    "sellingPrice": 360,
    "isVeg": false,
    "patternStr": "Amritsari\\s+Fish\\s+Fry"
  },
  {
    "sNo": 56,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Fish Tikka",
    "ingredients": [
      {
        "name": "Fish",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Curd",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 115.7,
    "sellingPrice": 360,
    "isVeg": false,
    "patternStr": "Fish\\s+Tikka"
  },
  {
    "sNo": 57,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Prawns Koliwada",
    "ingredients": [
      {
        "name": "Prawns",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Besan",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Refined Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Green Chilli",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 94.1,
    "sellingPrice": 360,
    "isVeg": false,
    "patternStr": "Prawns\\s+Koliwada"
  },
  {
    "sNo": 58,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Mutton Seekh Kebab",
    "ingredients": [
      {
        "name": "Mutton Keema",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Onion",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 139.6,
    "sellingPrice": 390,
    "isVeg": false,
    "patternStr": "Mutton\\s+Seekh\\s+Kebab"
  },
  {
    "sNo": 59,
    "category": "Starters & Appetizers (Non-Veg)",
    "dishName": "Mutton Shammi Kebab",
    "ingredients": [
      {
        "name": "Mutton Keema",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Dal Chana",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 110
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garam Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Besan / Gram Flour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 75
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 128.3,
    "sellingPrice": 390,
    "isVeg": false,
    "patternStr": "Mutton\\s+Shammi\\s+Kebab"
  },
  {
    "sNo": 60,
    "category": "Main Course — Vegetarian",
    "dishName": "Paneer Butter Masala",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Butter",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Fresh Cream",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Tomato",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 112.4,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Paneer\\s+Butter\\s+Masala"
  },
  {
    "sNo": 61,
    "category": "Main Course — Vegetarian",
    "dishName": "Shahi Paneer",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Butter",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Cream",
        "quantity": 0.05,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Curd",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Tomato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 105.8,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Shahi\\s+Paneer"
  },
  {
    "sNo": 62,
    "category": "Main Course — Vegetarian",
    "dishName": "Kadai Paneer",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Capsicum",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 87,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Kadai\\s+Paneer"
  },
  {
    "sNo": 63,
    "category": "Main Course — Vegetarian",
    "dishName": "Palak Paneer",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Spinach",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Garlic",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Cream",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 97.2,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Palak\\s+Paneer"
  },
  {
    "sNo": 64,
    "category": "Main Course — Vegetarian",
    "dishName": "Matar Paneer",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Green Peas",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 79.8,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Matar\\s+Paneer"
  },
  {
    "sNo": 65,
    "category": "Main Course — Vegetarian",
    "dishName": "Paneer Lababdar",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Butter",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Cream",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Tomato",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 104.9,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Paneer\\s+Lababdar"
  },
  {
    "sNo": 66,
    "category": "Main Course — Vegetarian",
    "dishName": "Paneer Bhurji",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 89.1,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Paneer\\s+Bhurji"
  },
  {
    "sNo": 67,
    "category": "Main Course — Vegetarian",
    "dishName": "Malai Kofta",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Potato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Cream",
        "quantity": 0.05,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Butter",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Tomato/Onion Gravy",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 70.3,
    "sellingPrice": 260,
    "isVeg": true,
    "patternStr": "Malai\\s+Kofta"
  },
  {
    "sNo": 68,
    "category": "Main Course — Vegetarian",
    "dishName": "Dal Makhani",
    "ingredients": [
      {
        "name": "Dal Masoor/Urad",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 110
      },
      {
        "name": "Butter",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Fresh Cream",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 55.1,
    "sellingPrice": 230,
    "isVeg": true,
    "patternStr": "Dal\\s+Makhani"
  },
  {
    "sNo": 69,
    "category": "Main Course — Vegetarian",
    "dishName": "Dal Tadka",
    "ingredients": [
      {
        "name": "Dal Toor",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 120
      },
      {
        "name": "Ghee",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Cumin",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 40.4,
    "sellingPrice": 180,
    "isVeg": true,
    "patternStr": "Dal\\s+Tadka"
  },
  {
    "sNo": 70,
    "category": "Main Course — Vegetarian",
    "dishName": "Dal Fry",
    "ingredients": [
      {
        "name": "Dal Toor",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 120
      },
      {
        "name": "Refined Oil/Ghee",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Onion",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 39.8,
    "sellingPrice": 180,
    "isVeg": true,
    "patternStr": "Dal\\s+Fry"
  },
  {
    "sNo": 71,
    "category": "Main Course — Vegetarian",
    "dishName": "Chole Masala",
    "ingredients": [
      {
        "name": "Chole",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 110
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 35.5,
    "sellingPrice": 200,
    "isVeg": true,
    "patternStr": "Chole\\s+Masala"
  },
  {
    "sNo": 72,
    "category": "Main Course — Vegetarian",
    "dishName": "Rajma Masala / Chawal",
    "ingredients": [
      {
        "name": "Rajma",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 140
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 35.8,
    "sellingPrice": 200,
    "isVeg": true,
    "patternStr": "Rajma\\s+Masala|Chawal"
  },
  {
    "sNo": 73,
    "category": "Main Course — Vegetarian",
    "dishName": "Aloo Gobi",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Cauliflower",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 24.8,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Aloo\\s+Gobi"
  },
  {
    "sNo": 74,
    "category": "Main Course — Vegetarian",
    "dishName": "Aloo Matar",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Green Peas",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 23.8,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Aloo\\s+Matar"
  },
  {
    "sNo": 75,
    "category": "Main Course — Vegetarian",
    "dishName": "Aloo Jeera",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Turmeric",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 18.3,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Aloo\\s+Jeera"
  },
  {
    "sNo": 76,
    "category": "Main Course — Vegetarian",
    "dishName": "Bhindi Masala",
    "ingredients": [
      {
        "name": "Bhindi / Okra",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 38.2,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Bhindi\\s+Masala"
  },
  {
    "sNo": 77,
    "category": "Main Course — Vegetarian",
    "dishName": "Baingan Bharta",
    "ingredients": [
      {
        "name": "Brinjal / Eggplant",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 37,
    "sellingPrice": 220,
    "isVeg": false,
    "patternStr": "Baingan\\s+Bharta"
  },
  {
    "sNo": 78,
    "category": "Main Course — Vegetarian",
    "dishName": "Mix Vegetable Curry",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Capsicum",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Peas",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Paneer",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Tomato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 34.1,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Mix\\s+Vegetable\\s+Curry"
  },
  {
    "sNo": 79,
    "category": "Main Course — Vegetarian",
    "dishName": "Navratan Korma",
    "ingredients": [
      {
        "name": "Mixed Veggies",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Paneer",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Cream",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Cashews/Nuts",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 750
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 59.6,
    "sellingPrice": 220,
    "isVeg": false,
    "patternStr": "Navratan\\s+Korma"
  },
  {
    "sNo": 80,
    "category": "Main Course — Vegetarian",
    "dishName": "Dum Aloo (Kashmiri)",
    "ingredients": [
      {
        "name": "Potato",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Curd",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Fennel",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Kashmiri Mirch",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 23.9,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Dum\\s+Aloo\\s+Kashmiri"
  },
  {
    "sNo": 81,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Butter Chicken",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Butter",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Fresh Cream",
        "quantity": 0.04,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Tomato",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 110.4,
    "sellingPrice": 350,
    "isVeg": false,
    "patternStr": "Butter\\s+Chicken"
  },
  {
    "sNo": 82,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Chicken Curry (Home Style)",
    "ingredients": [
      {
        "name": "Chicken Whole",
        "quantity": 0.28,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Onion",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Mustard/Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 80.1,
    "sellingPrice": 310,
    "isVeg": false,
    "patternStr": "Chicken\\s+Curry\\s+Home\\s+Style"
  },
  {
    "sNo": 83,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Kadai Chicken",
    "ingredients": [
      {
        "name": "Chicken",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Capsicum",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 75.1,
    "sellingPrice": 310,
    "isVeg": false,
    "patternStr": "Kadai\\s+Chicken"
  },
  {
    "sNo": 84,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Chicken Tikka Masala",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Curd",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Butter",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Tomato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 97.2,
    "sellingPrice": 350,
    "isVeg": false,
    "patternStr": "Chicken\\s+Tikka\\s+Masala"
  },
  {
    "sNo": 85,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Chicken Do Pyaza",
    "ingredients": [
      {
        "name": "Chicken",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Onion",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 71.8,
    "sellingPrice": 310,
    "isVeg": false,
    "patternStr": "Chicken\\s+Do\\s+Pyaza"
  },
  {
    "sNo": 86,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Chicken Korma",
    "ingredients": [
      {
        "name": "Chicken",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Curd",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Cream",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Ghee",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 85.3,
    "sellingPrice": 310,
    "isVeg": false,
    "patternStr": "Chicken\\s+Korma"
  },
  {
    "sNo": 87,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Chicken Rara",
    "ingredients": [
      {
        "name": "Chicken",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Chicken Keema",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Onion",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 73.2,
    "sellingPrice": 310,
    "isVeg": false,
    "patternStr": "Chicken\\s+Rara"
  },
  {
    "sNo": 88,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Mutton Curry",
    "ingredients": [
      {
        "name": "Mutton",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Onion",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 163.6,
    "sellingPrice": 440,
    "isVeg": false,
    "patternStr": "Mutton\\s+Curry"
  },
  {
    "sNo": 89,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Mutton Rogan Josh",
    "ingredients": [
      {
        "name": "Mutton",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Curd",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 157.9,
    "sellingPrice": 440,
    "isVeg": false,
    "patternStr": "Mutton\\s+Rogan\\s+Josh"
  },
  {
    "sNo": 90,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Mutton Rara",
    "ingredients": [
      {
        "name": "Mutton",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Mutton Keema",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Onion",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 171.8,
    "sellingPrice": 440,
    "isVeg": false,
    "patternStr": "Mutton\\s+Rara"
  },
  {
    "sNo": 91,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Mutton Keema Matar",
    "ingredients": [
      {
        "name": "Mutton Keema",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Green Peas",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 141.6,
    "sellingPrice": 440,
    "isVeg": false,
    "patternStr": "Mutton\\s+Keema\\s+Matar"
  },
  {
    "sNo": 92,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Egg Curry (2 Eggs)",
    "ingredients": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 32.4,
    "sellingPrice": 190,
    "isVeg": false,
    "patternStr": "Egg\\s+Curry\\s+2\\s+Eggs"
  },
  {
    "sNo": 93,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Egg Bhurji",
    "ingredients": [
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 34.8,
    "sellingPrice": 190,
    "isVeg": false,
    "patternStr": "Egg\\s+Bhurji"
  },
  {
    "sNo": 94,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Fish Curry",
    "ingredients": [
      {
        "name": "Fish Pomfret",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 121.9,
    "sellingPrice": 380,
    "isVeg": false,
    "patternStr": "Fish\\s+Curry"
  },
  {
    "sNo": 95,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Fish Masala",
    "ingredients": [
      {
        "name": "Fish",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Onion",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Mustard Oil",
        "quantity": 0.035,
        "unit": "LTR",
        "costPrice": 150
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 122.4,
    "sellingPrice": 380,
    "isVeg": false,
    "patternStr": "Fish\\s+Masala"
  },
  {
    "sNo": 96,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Prawns Masala",
    "ingredients": [
      {
        "name": "Prawns",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 100.6,
    "sellingPrice": 380,
    "isVeg": false,
    "patternStr": "Prawns\\s+Masala"
  },
  {
    "sNo": 97,
    "category": "Main Course — Non-Vegetarian",
    "dishName": "Prawns Curry",
    "ingredients": [
      {
        "name": "Prawns",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Coconut Milk / Cream",
        "quantity": 0.05,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Turmeric Powder",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Coriander Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Garam Masala",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 350
      },
      {
        "name": "Kasuri Methi",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 300
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 108.3,
    "sellingPrice": 380,
    "isVeg": false,
    "patternStr": "Prawns\\s+Curry"
  },
  {
    "sNo": 98,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Chicken Biryani",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Chicken Boneless",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Onion",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Curd",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Ghee",
        "quantity": 0.025,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Biryani Masala",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Whole Garam Masala (Bay Leaf, Cinnamon, Cloves, Cardamom, Star Anise)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Fried Onion / Birista",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Saffron Milk",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 124.1,
    "sellingPrice": 330,
    "isVeg": false,
    "patternStr": "Chicken\\s+Biryani"
  },
  {
    "sNo": 99,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Chicken Dum Biryani (Leg/Bone)",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Chicken Whole",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Onion",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Curd",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Ghee",
        "quantity": 0.025,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Fried Onion / Birista",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Saffron Milk",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 95.6,
    "sellingPrice": 200,
    "isVeg": false,
    "patternStr": "Chicken\\s+Dum\\s+Biryani\\s+Leg|Bone"
  },
  {
    "sNo": 100,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Mutton Biryani",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Mutton",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Onion",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Curd",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Ghee",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Biryani Masala",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Whole Garam Masala (Bay Leaf, Cinnamon, Cloves, Cardamom, Star Anise)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Fried Onion / Birista",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Saffron Milk",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 190.6,
    "sellingPrice": 420,
    "isVeg": false,
    "patternStr": "Mutton\\s+Biryani"
  },
  {
    "sNo": 101,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Veg Biryani",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Paneer",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Potato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Peas/Carrot",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Ghee",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Whole Garam Masala (Bay Leaf, Cinnamon, Cloves, Cardamom, Star Anise)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Fried Onion / Birista",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Saffron Milk",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 73.3,
    "sellingPrice": 220,
    "isVeg": true,
    "patternStr": "Veg\\s+Biryani"
  },
  {
    "sNo": 102,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Egg Biryani",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ghee",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Whole Garam Masala (Bay Leaf, Cinnamon, Cloves, Cardamom, Star Anise)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Fried Onion / Birista",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Saffron Milk",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 70.8,
    "sellingPrice": 240,
    "isVeg": false,
    "patternStr": "Egg\\s+Biryani"
  },
  {
    "sNo": 103,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Prawns Biryani",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Prawns",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 400
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ghee",
        "quantity": 0.025,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Whole Garam Masala (Bay Leaf, Cinnamon, Cloves, Cardamom, Star Anise)",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Coriander Leaves",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Fried Onion / Birista",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Ginger-Garlic Paste",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Saffron Milk",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Red Chilli Powder",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 131.6,
    "sellingPrice": 200,
    "isVeg": false,
    "patternStr": "Prawns\\s+Biryani"
  },
  {
    "sNo": 104,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Steamed Basmati Rice",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Whole Spices (Bay Leaf, Cinnamon, Cloves)",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 900
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 16.3,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Steamed\\s+Basmati\\s+Rice"
  },
  {
    "sNo": 105,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Jeera Rice",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Ghee",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Cumin Seeds",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Whole Spices (Bay Leaf, Cinnamon, Cloves)",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 900
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 23.1,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Jeera\\s+Rice"
  },
  {
    "sNo": 106,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Veg Pulao",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Peas",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Carrot/Potato",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Ghee",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Whole Spices (Bay Leaf, Cinnamon, Cloves)",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 900
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 28,
    "sellingPrice": 180,
    "isVeg": true,
    "patternStr": "Veg\\s+Pulao"
  },
  {
    "sNo": 107,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Peas Pulao / Matar Pulao",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Green Peas",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Ghee",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Whole Spices (Bay Leaf, Cinnamon, Cloves)",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 900
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 29.4,
    "sellingPrice": 180,
    "isVeg": true,
    "patternStr": "Peas\\s+Pulao|Matar\\s+Pulao"
  },
  {
    "sNo": 108,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Curd Rice",
    "ingredients": [
      {
        "name": "Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Curd",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mustard Seeds",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Curry Leaves",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Whole Spices (Bay Leaf, Cinnamon, Cloves)",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 900
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 22.8,
    "sellingPrice": 200,
    "isVeg": true,
    "patternStr": "Curd\\s+Rice"
  },
  {
    "sNo": 109,
    "category": "Rice, Pulao & Biryani",
    "dishName": "Dal Khichdi",
    "ingredients": [
      {
        "name": "Rice",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Dal Moong",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 120
      },
      {
        "name": "Ghee",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Cumin",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Whole Spices (Bay Leaf, Cinnamon, Cloves)",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 900
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 25.3,
    "sellingPrice": 200,
    "isVeg": true,
    "patternStr": "Dal\\s+Khichdi"
  },
  {
    "sNo": 110,
    "category": "Indo-Chinese & Asian",
    "dishName": "Veg Fried Rice",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Capsicum",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Carrot",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 31.6,
    "sellingPrice": 190,
    "isVeg": true,
    "patternStr": "Veg\\s+Fried\\s+Rice"
  },
  {
    "sNo": 111,
    "category": "Indo-Chinese & Asian",
    "dishName": "Egg Fried Rice",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 42,
    "sellingPrice": 210,
    "isVeg": false,
    "patternStr": "Egg\\s+Fried\\s+Rice"
  },
  {
    "sNo": 112,
    "category": "Indo-Chinese & Asian",
    "dishName": "Chicken Fried Rice",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Chicken Boneless",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 54,
    "sellingPrice": 260,
    "isVeg": false,
    "patternStr": "Chicken\\s+Fried\\s+Rice"
  },
  {
    "sNo": 113,
    "category": "Indo-Chinese & Asian",
    "dishName": "Schezwan Veg Fried Rice",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Veggies",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Schezwan Sauce",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 30.6,
    "sellingPrice": 190,
    "isVeg": false,
    "patternStr": "Schezwan\\s+Veg\\s+Fried\\s+Rice"
  },
  {
    "sNo": 114,
    "category": "Indo-Chinese & Asian",
    "dishName": "Schezwan Chicken Fried Rice",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Chicken",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Schezwan Sauce",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 46.4,
    "sellingPrice": 260,
    "isVeg": false,
    "patternStr": "Schezwan\\s+Chicken\\s+Fried\\s+Rice"
  },
  {
    "sNo": 115,
    "category": "Indo-Chinese & Asian",
    "dishName": "Veg Hakka Noodles",
    "ingredients": [
      {
        "name": "Noodles",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Cabbage/Carrot/Capsicum",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 28.4,
    "sellingPrice": 190,
    "isVeg": true,
    "patternStr": "Veg\\s+Hakka\\s+Noodles"
  },
  {
    "sNo": 116,
    "category": "Indo-Chinese & Asian",
    "dishName": "Egg Noodles",
    "ingredients": [
      {
        "name": "Noodles",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Veggies",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 39.5,
    "sellingPrice": 210,
    "isVeg": false,
    "patternStr": "Egg\\s+Noodles"
  },
  {
    "sNo": 117,
    "category": "Indo-Chinese & Asian",
    "dishName": "Chicken Hakka Noodles",
    "ingredients": [
      {
        "name": "Noodles",
        "quantity": 0.12,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Chicken Boneless",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Veggies",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Refined Oil",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 90
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 51.5,
    "sellingPrice": 260,
    "isVeg": false,
    "patternStr": "Chicken\\s+Hakka\\s+Noodles"
  },
  {
    "sNo": 118,
    "category": "Indo-Chinese & Asian",
    "dishName": "Veg Manchurian Gravy",
    "ingredients": [
      {
        "name": "Veg Balls",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Capsicum",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Soya/Chilli Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 34,
    "sellingPrice": 190,
    "isVeg": true,
    "patternStr": "Veg\\s+Manchurian\\s+Gravy"
  },
  {
    "sNo": 119,
    "category": "Indo-Chinese & Asian",
    "dishName": "Chicken Manchurian Gravy",
    "ingredients": [
      {
        "name": "Chicken Keema Balls",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Capsicum",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Soya/Chilli Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 55,
    "sellingPrice": 260,
    "isVeg": false,
    "patternStr": "Chicken\\s+Manchurian\\s+Gravy"
  },
  {
    "sNo": 120,
    "category": "Indo-Chinese & Asian",
    "dishName": "Chilli Paneer Gravy",
    "ingredients": [
      {
        "name": "Paneer",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Capsicum",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Cornflour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Refined Oil",
        "quantity": 0.025,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 78.1,
    "sellingPrice": 190,
    "isVeg": true,
    "patternStr": "Chilli\\s+Paneer\\s+Gravy"
  },
  {
    "sNo": 121,
    "category": "Indo-Chinese & Asian",
    "dishName": "Chilli Chicken Gravy",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.22,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Capsicum",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Refined Oil",
        "quantity": 0.03,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Ginger (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Spring Onion",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Vinegar",
        "quantity": 0.008,
        "unit": "LTR",
        "costPrice": 40
      },
      {
        "name": "Red Chilli Sauce",
        "quantity": 0.01,
        "unit": "LTR",
        "costPrice": 200
      },
      {
        "name": "Cornflour",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 78.7,
    "sellingPrice": 260,
    "isVeg": false,
    "patternStr": "Chilli\\s+Chicken\\s+Gravy"
  },
  {
    "sNo": 122,
    "category": "Soups",
    "dishName": "Tomato Soup",
    "ingredients": [
      {
        "name": "Tomato",
        "quantity": 0.25,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Cream",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Sugar",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 22.4,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Tomato\\s+Soup"
  },
  {
    "sNo": 123,
    "category": "Soups",
    "dishName": "Sweet Corn Veg Soup",
    "ingredients": [
      {
        "name": "Sweet Corn",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Cornflour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 12.5,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Sweet\\s+Corn\\s+Veg\\s+Soup"
  },
  {
    "sNo": 124,
    "category": "Soups",
    "dishName": "Veg Manchow Soup",
    "ingredients": [
      {
        "name": "Mixed Veggies",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Fried Noodles",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 11.4,
    "sellingPrice": 130,
    "isVeg": false,
    "patternStr": "Veg\\s+Manchow\\s+Soup"
  },
  {
    "sNo": 125,
    "category": "Soups",
    "dishName": "Hot & Sour Veg Soup",
    "ingredients": [
      {
        "name": "Mixed Veggies",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Chilli Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Vinegar",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 10.2,
    "sellingPrice": 130,
    "isVeg": false,
    "patternStr": "Hot\\s+&\\s+Sour\\s+Veg\\s+Soup"
  },
  {
    "sNo": 126,
    "category": "Soups",
    "dishName": "Lemon Coriander Soup",
    "ingredients": [
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 4
      },
      {
        "name": "Coriander",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Mixed Veggies",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 10.6,
    "sellingPrice": 130,
    "isVeg": false,
    "patternStr": "Lemon\\s+Coriander\\s+Soup"
  },
  {
    "sNo": 127,
    "category": "Soups",
    "dishName": "Chicken Clear Soup",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Pepper",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 25.2,
    "sellingPrice": 160,
    "isVeg": false,
    "patternStr": "Chicken\\s+Clear\\s+Soup"
  },
  {
    "sNo": 128,
    "category": "Soups",
    "dishName": "Chicken Sweet Corn Soup",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Sweet Corn",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Cornflour",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 31.3,
    "sellingPrice": 160,
    "isVeg": false,
    "patternStr": "Chicken\\s+Sweet\\s+Corn\\s+Soup"
  },
  {
    "sNo": 129,
    "category": "Soups",
    "dishName": "Chicken Manchow Soup",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Garlic",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Fried Noodles",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 26.6,
    "sellingPrice": 160,
    "isVeg": false,
    "patternStr": "Chicken\\s+Manchow\\s+Soup"
  },
  {
    "sNo": 130,
    "category": "Soups",
    "dishName": "Chicken Hot & Sour Soup",
    "ingredients": [
      {
        "name": "Chicken Boneless",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Chilli Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 95
      },
      {
        "name": "Vinegar",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Soya Sauce",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 25.4,
    "sellingPrice": 160,
    "isVeg": false,
    "patternStr": "Chicken\\s+Hot\\s+&\\s+Sour\\s+Soup"
  },
  {
    "sNo": 131,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Veg Burger",
    "ingredients": [
      {
        "name": "Burger Bun",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Veg Patty",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Lettuce/Tomato",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Mayonnaise/Sauce",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 140
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 20.4,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Veg\\s+Burger"
  },
  {
    "sNo": 132,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Chicken Burger",
    "ingredients": [
      {
        "name": "Burger Bun",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Chicken Patty",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Mayonnaise/Sauce",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 140
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 30.8,
    "sellingPrice": 210,
    "isVeg": false,
    "patternStr": "Chicken\\s+Burger"
  },
  {
    "sNo": 133,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Veg Grilled Sandwich",
    "ingredients": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Potato/Cucumber/Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 25
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Green Chutney",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 23.8,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Veg\\s+Grilled\\s+Sandwich"
  },
  {
    "sNo": 134,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Cheese Grilled Sandwich",
    "ingredients": [
      {
        "name": "Bread",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Cheese",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 36.6,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Cheese\\s+Grilled\\s+Sandwich"
  },
  {
    "sNo": 135,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Club Sandwich (Veg)",
    "ingredients": [
      {
        "name": "Bread",
        "quantity": 3,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Cucumber/Tomato/Lettuce",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Cheese",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 39.4,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Club\\s+Sandwich\\s+Veg"
  },
  {
    "sNo": 136,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Chicken Club Sandwich",
    "ingredients": [
      {
        "name": "Bread",
        "quantity": 3,
        "unit": "PC",
        "costPrice": 5
      },
      {
        "name": "Chicken Boneless",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Eggs",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 7
      },
      {
        "name": "Cheese",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 61,
    "sellingPrice": 180,
    "isVeg": false,
    "patternStr": "Chicken\\s+Club\\s+Sandwich"
  },
  {
    "sNo": 137,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Margherita Pizza (8 Inch)",
    "ingredients": [
      {
        "name": "Pizza Base",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 25
      },
      {
        "name": "Pizza Sauce",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Cheese Mozzarella",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 67.6,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Margherita\\s+Pizza\\s+8\\s+Inch"
  },
  {
    "sNo": 138,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Veg Farmhouse Pizza (8 Inch)",
    "ingredients": [
      {
        "name": "Pizza Base",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 25
      },
      {
        "name": "Cheese",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Capsicum",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Onion",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Mushroom",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 160
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 81.1,
    "sellingPrice": 280,
    "isVeg": true,
    "patternStr": "Veg\\s+Farmhouse\\s+Pizza\\s+8\\s+Inch"
  },
  {
    "sNo": 139,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Chicken BBQ Pizza (8 Inch)",
    "ingredients": [
      {
        "name": "Pizza Base",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 25
      },
      {
        "name": "Cheese",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Chicken Tikka/BBQ",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 83.3,
    "sellingPrice": 340,
    "isVeg": false,
    "patternStr": "Chicken\\s+BBQ\\s+Pizza\\s+8\\s+Inch"
  },
  {
    "sNo": 140,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "White Sauce Pasta (Veg)",
    "ingredients": [
      {
        "name": "Pasta",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Milk",
        "quantity": 0.1,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Butter",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Maida",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 35
      },
      {
        "name": "Cheese",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 33.9,
    "sellingPrice": 240,
    "isVeg": true,
    "patternStr": "White\\s+Sauce\\s+Pasta\\s+Veg"
  },
  {
    "sNo": 141,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Red Sauce Pasta (Arrabbiata)",
    "ingredients": [
      {
        "name": "Pasta",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Tomato Sauce",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Garlic",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Olive/Refined Oil",
        "quantity": 0.015,
        "unit": "LTR",
        "costPrice": 130
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 16.3,
    "sellingPrice": 240,
    "isVeg": true,
    "patternStr": "Red\\s+Sauce\\s+Pasta\\s+Arrabbiata"
  },
  {
    "sNo": 142,
    "category": "Continental, Burgers, Pizzas & Pastas",
    "dishName": "Chicken White Sauce Pasta",
    "ingredients": [
      {
        "name": "Pasta",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Chicken Boneless",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 260
      },
      {
        "name": "Milk",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Butter",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Cheese",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 420
      },
      {
        "name": "Garlic (Chopped)",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 200
      },
      {
        "name": "Oregano",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Chilli Flakes",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Black Pepper Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 47.8,
    "sellingPrice": 290,
    "isVeg": false,
    "patternStr": "Chicken\\s+White\\s+Sauce\\s+Pasta"
  },
  {
    "sNo": 143,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Green Salad",
    "ingredients": [
      {
        "name": "Cucumber",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Onion",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 4
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 13.5,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Green\\s+Salad"
  },
  {
    "sNo": 144,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Kachumber Salad",
    "ingredients": [
      {
        "name": "Onion",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Cucumber",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 80
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 7.9,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Kachumber\\s+Salad"
  },
  {
    "sNo": 145,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Boondi Raita",
    "ingredients": [
      {
        "name": "Curd / Yoghurt",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Boondi",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Roasted Cumin",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.005,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 15,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Boondi\\s+Raita"
  },
  {
    "sNo": 146,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Mix Veg Raita",
    "ingredients": [
      {
        "name": "Curd",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Onion",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Cucumber",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.005,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 15,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Mix\\s+Veg\\s+Raita"
  },
  {
    "sNo": 147,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Pineapple Raita",
    "ingredients": [
      {
        "name": "Curd",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Pineapple",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Sugar",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.005,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 17.5,
    "sellingPrice": 110,
    "isVeg": true,
    "patternStr": "Pineapple\\s+Raita"
  },
  {
    "sNo": 148,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Plain Curd / Dahi",
    "ingredients": [
      {
        "name": "Curd / Yoghurt",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.005,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 12,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Plain\\s+Curd|Dahi"
  },
  {
    "sNo": 149,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Roasted Papad (2 Pcs)",
    "ingredients": [
      {
        "name": "Papad",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 100
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.005,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 201.5,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Roasted\\s+Papad\\s+2\\s+Pcs"
  },
  {
    "sNo": 150,
    "category": "Salads, Raita & Accompaniments",
    "dishName": "Masala Papad (2 Pcs)",
    "ingredients": [
      {
        "name": "Papad",
        "quantity": 2,
        "unit": "PC",
        "costPrice": 100
      },
      {
        "name": "Onion",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 30
      },
      {
        "name": "Tomato",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Green Chilli",
        "quantity": 0.006,
        "unit": "KG",
        "costPrice": 60
      },
      {
        "name": "Chaat Masala",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Salt",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 20
      },
      {
        "name": "Roasted Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.005,
        "unit": "LTR",
        "costPrice": 80
      },
      {
        "name": "Coriander Leaves (Garnish)",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      }
    ],
    "costPrice": 205.7,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Masala\\s+Papad\\s+2\\s+Pcs"
  },
  {
    "sNo": 151,
    "category": "Desserts & Sweets",
    "dishName": "Gulab Jamun (2 Pcs)",
    "ingredients": [
      {
        "name": "Khoya/Mix",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Sugar",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Refined Oil/Ghee",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 32.4,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Gulab\\s+Jamun\\s+2\\s+Pcs"
  },
  {
    "sNo": 152,
    "category": "Desserts & Sweets",
    "dishName": "Rasgulla (2 Pcs)",
    "ingredients": [
      {
        "name": "Chhena",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Sugar",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 34.6,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Rasgulla\\s+2\\s+Pcs"
  },
  {
    "sNo": 153,
    "category": "Desserts & Sweets",
    "dishName": "Gajar Ka Halwa",
    "ingredients": [
      {
        "name": "Carrot",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 40
      },
      {
        "name": "Milk",
        "quantity": 0.15,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Sugar",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ghee",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Nuts",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 850
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 54.4,
    "sellingPrice": 160,
    "isVeg": true,
    "patternStr": "Gajar\\s+Ka\\s+Halwa"
  },
  {
    "sNo": 154,
    "category": "Desserts & Sweets",
    "dishName": "Moong Dal Halwa",
    "ingredients": [
      {
        "name": "Dal Moong",
        "quantity": 0.08,
        "unit": "KG",
        "costPrice": 120
      },
      {
        "name": "Ghee",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 550
      },
      {
        "name": "Sugar",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Milk",
        "quantity": 0.08,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 51.3,
    "sellingPrice": 160,
    "isVeg": true,
    "patternStr": "Moong\\s+Dal\\s+Halwa"
  },
  {
    "sNo": 155,
    "category": "Desserts & Sweets",
    "dishName": "Kheer",
    "ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Milk",
        "quantity": 0.25,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Sugar",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Nuts",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 850
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 44.9,
    "sellingPrice": 120,
    "isVeg": true,
    "patternStr": "Kheer"
  },
  {
    "sNo": 156,
    "category": "Desserts & Sweets",
    "dishName": "Rasmalai (2 Pcs)",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Chhena",
        "quantity": 0.06,
        "unit": "KG",
        "costPrice": 320
      },
      {
        "name": "Sugar",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 45.7,
    "sellingPrice": 120,
    "isVeg": true,
    "patternStr": "Rasmalai\\s+2\\s+Pcs"
  },
  {
    "sNo": 157,
    "category": "Desserts & Sweets",
    "dishName": "Ice Cream (Vanilla / Chocolate / Butterscotch)",
    "ingredients": [
      {
        "name": "Ice Cream",
        "quantity": 1,
        "unit": "LTR",
        "costPrice": 250
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 263.1,
    "sellingPrice": 120,
    "isVeg": true,
    "patternStr": "Ice\\s+Cream\\s+Vanilla|Chocolate|Butterscotch"
  },
  {
    "sNo": 158,
    "category": "Desserts & Sweets",
    "dishName": "Brownie with Ice Cream",
    "ingredients": [
      {
        "name": "Brownie",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 100
      },
      {
        "name": "Chocolate Sauce",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "Scoop",
        "costPrice": 250
      },
      {
        "name": "Green Cardamom Powder",
        "quantity": 0.002,
        "unit": "KG",
        "costPrice": 1800
      },
      {
        "name": "Saffron Strands",
        "quantity": 0.001,
        "unit": "KG",
        "costPrice": 1500
      },
      {
        "name": "Chopped Almonds / Pistachio",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 800
      }
    ],
    "costPrice": 364.9,
    "sellingPrice": 160,
    "isVeg": true,
    "patternStr": "Brownie\\s+with\\s+Ice\\s+Cream"
  },
  {
    "sNo": 159,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Masala Chai",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.15,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Tea Leaves",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 280
      },
      {
        "name": "Sugar",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ginger",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 180
      }
    ],
    "costPrice": 13.4,
    "sellingPrice": 40,
    "isVeg": true,
    "patternStr": "Masala\\s+Chai"
  },
  {
    "sNo": 160,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Ginger Tea",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.15,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Tea Leaves",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 280
      },
      {
        "name": "Sugar",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ginger",
        "quantity": 0.008,
        "unit": "KG",
        "costPrice": 180
      }
    ],
    "costPrice": 13.9,
    "sellingPrice": 40,
    "isVeg": true,
    "patternStr": "Ginger\\s+Tea"
  },
  {
    "sNo": 161,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Green Tea",
    "ingredients": [
      {
        "name": "Green Tea Bag",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 280
      },
      {
        "name": "Hot Water",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 100
      }
    ],
    "costPrice": 295,
    "sellingPrice": 40,
    "isVeg": true,
    "patternStr": "Green\\s+Tea"
  },
  {
    "sNo": 162,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Espresso Coffee",
    "ingredients": [
      {
        "name": "Coffee Powder",
        "quantity": 0.012,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Hot Water",
        "quantity": 0.15,
        "unit": "KG",
        "costPrice": 100
      }
    ],
    "costPrice": 20.4,
    "sellingPrice": 70,
    "isVeg": true,
    "patternStr": "Espresso\\s+Coffee"
  },
  {
    "sNo": 163,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Cappuccino / Cafe Latte",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.18,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Coffee Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Sugar",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 45
      }
    ],
    "costPrice": 16,
    "sellingPrice": 80,
    "isVeg": true,
    "patternStr": "Cappuccino|Cafe\\s+Latte"
  },
  {
    "sNo": 164,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Cold Coffee",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Coffee Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Sugar",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Chocolate Sauce",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 90
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 19.7,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Cold\\s+Coffee"
  },
  {
    "sNo": 165,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Cold Coffee with Ice Cream",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Coffee Powder",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 450
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "Scoop",
        "costPrice": 250
      }
    ],
    "costPrice": 266.5,
    "sellingPrice": 130,
    "isVeg": true,
    "patternStr": "Cold\\s+Coffee\\s+with\\s+Ice\\s+Cream"
  },
  {
    "sNo": 166,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Sweet Lassi",
    "ingredients": [
      {
        "name": "Curd",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Sugar",
        "quantity": 0.025,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ice",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 15.6,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Sweet\\s+Lassi"
  },
  {
    "sNo": 167,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Salted Lassi",
    "ingredients": [
      {
        "name": "Curd",
        "quantity": 0.2,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Cumin Powder",
        "quantity": 0.003,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 15.3,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Salted\\s+Lassi"
  },
  {
    "sNo": 168,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Mango Lassi",
    "ingredients": [
      {
        "name": "Curd",
        "quantity": 0.18,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Mango Pulp",
        "quantity": 0.04,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Sugar",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 17.8,
    "sellingPrice": 90,
    "isVeg": true,
    "patternStr": "Mango\\s+Lassi"
  },
  {
    "sNo": 169,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Chaas / Buttermilk",
    "ingredients": [
      {
        "name": "Curd",
        "quantity": 0.1,
        "unit": "KG",
        "costPrice": 70
      },
      {
        "name": "Water",
        "quantity": 0.15,
        "unit": "LTR",
        "costPrice": 100
      },
      {
        "name": "Cumin",
        "quantity": 0.004,
        "unit": "KG",
        "costPrice": 250
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 23.5,
    "sellingPrice": 80,
    "isVeg": true,
    "patternStr": "Chaas|Buttermilk"
  },
  {
    "sNo": 170,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Fresh Lime Soda (Sweet / Salt)",
    "ingredients": [
      {
        "name": "Soda Water",
        "quantity": 0.3,
        "unit": "LTR",
        "costPrice": 35
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 4
      },
      {
        "name": "Sugar Syrup / Salt",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 20
      }
    ],
    "costPrice": 14.9,
    "sellingPrice": 50,
    "isVeg": true,
    "patternStr": "Fresh\\s+Lime\\s+Soda\\s+Sweet|Salt"
  },
  {
    "sNo": 171,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Lemon Iced Tea",
    "ingredients": [
      {
        "name": "Tea",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 280
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 4
      },
      {
        "name": "Sugar",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ice",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 6.8,
    "sellingPrice": 40,
    "isVeg": true,
    "patternStr": "Lemon\\s+Iced\\s+Tea"
  },
  {
    "sNo": 172,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Mango Shake",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Mango Pulp",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 100
      },
      {
        "name": "Sugar",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 18.4,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Mango\\s+Shake"
  },
  {
    "sNo": 173,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Banana Shake",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Banana",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 100
      },
      {
        "name": "Sugar",
        "quantity": 0.02,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 113.4,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Banana\\s+Shake"
  },
  {
    "sNo": 174,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Chocolate Shake",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Chocolate Syrup",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Sugar",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 18.6,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Chocolate\\s+Shake"
  },
  {
    "sNo": 175,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Strawberry Shake",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Strawberry Syrup",
        "quantity": 0.03,
        "unit": "KG",
        "costPrice": 180
      },
      {
        "name": "Sugar",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 45
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 18.6,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Strawberry\\s+Shake"
  },
  {
    "sNo": 176,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Vanilla Shake",
    "ingredients": [
      {
        "name": "Milk",
        "quantity": 0.2,
        "unit": "LTR",
        "costPrice": 60
      },
      {
        "name": "Vanilla Ice Cream",
        "quantity": 1,
        "unit": "Scoop",
        "costPrice": 250
      },
      {
        "name": "Sugar",
        "quantity": 0.015,
        "unit": "KG",
        "costPrice": 45
      }
    ],
    "costPrice": 262.7,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Vanilla\\s+Shake"
  },
  {
    "sNo": 177,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Virgin Mojito",
    "ingredients": [
      {
        "name": "Soda Water",
        "quantity": 0.25,
        "unit": "LTR",
        "costPrice": 35
      },
      {
        "name": "Mint Leaves",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 50
      },
      {
        "name": "Lemon",
        "quantity": 1,
        "unit": "PC",
        "costPrice": 4
      },
      {
        "name": "Sugar Syrup",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 45
      },
      {
        "name": "Ice Cubes",
        "quantity": 0.05,
        "unit": "KG",
        "costPrice": 10
      }
    ],
    "costPrice": 14.4,
    "sellingPrice": 80,
    "isVeg": true,
    "patternStr": "Virgin\\s+Mojito"
  },
  {
    "sNo": 178,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Blue Lagoon Mocktail",
    "ingredients": [
      {
        "name": "Sprite",
        "quantity": 0.25,
        "unit": "LTR",
        "costPrice": 35
      },
      {
        "name": "Blue Curacao Syrup",
        "quantity": 0.02,
        "unit": "LTR",
        "costPrice": 180
      },
      {
        "name": "Lemon Juice",
        "quantity": 0.01,
        "unit": "KG",
        "costPrice": 80
      }
    ],
    "costPrice": 13.2,
    "sellingPrice": 150,
    "isVeg": true,
    "patternStr": "Blue\\s+Lagoon\\s+Mocktail"
  },
  {
    "sNo": 179,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Packaged Mineral Water (500ml / 1L)",
    "ingredients": [
      {
        "name": "Direct Stock Item",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 100
      }
    ],
    "costPrice": 0.5,
    "sellingPrice": 20,
    "isVeg": true,
    "patternStr": "Packaged\\s+Mineral\\s+Water\\s+500ml|1L"
  },
  {
    "sNo": 180,
    "category": "Beverages, Shakes & Mocktails (Non-Alcoholic)",
    "dishName": "Coca Cola / Sprite / Thums Up (300ml)",
    "ingredients": [
      {
        "name": "Direct Stock Item",
        "quantity": 0.005,
        "unit": "KG",
        "costPrice": 100
      }
    ],
    "costPrice": 0.5,
    "sellingPrice": 80,
    "isVeg": true,
    "patternStr": "Coca\\s+Cola|Sprite|Thums\\s+Up\\s+300ml"
  }
];

export const PREP_MASTER_RECIPES = PREP_DISHES.map((d) => ({
  pattern: new RegExp(d.patternStr, 'i'),
  dishName: d.dishName,
  category: d.category,
  sellingPrice: d.sellingPrice,
  costPrice: d.costPrice,
  isVeg: d.isVeg,
  ingredients: d.ingredients,
}));
