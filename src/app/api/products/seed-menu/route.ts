import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * POST /api/products/seed-menu
 * Body: { propertyId?: string, menuType?: 'RESTAURANT' | 'BAR' | 'CAFE' | 'ALL' }
 *
 * Seeds complete restaurant menu categories + products (120+ items).
 * Skips items that already exist (by name per property).
 * Returns { categoriesCreated, productsCreated, skipped }
 */

/* ─── Master Menu Data ───────────────────────────────────────────────────── */

interface SeedProduct {
  name: string;
  sellingPrice: number;
  halfPrice?: number;
  costPrice: number;
  isVeg: boolean;
  mealTimes?: string;
  description?: string;
  menuType?: string;
  pegSize?: number;
}

interface SeedCategory {
  name: string;
  menuType: string;
  products: SeedProduct[];
}

const RESTAURANT_MENU: SeedCategory[] = [
  /* ─── BREAKFAST ─── */
  {
    name: 'Breakfast',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Plain Paratha',         sellingPrice: 60,  costPrice: 18, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Aloo Paratha',          sellingPrice: 80,  costPrice: 25, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Paneer Paratha',        sellingPrice: 110, costPrice: 35, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Gobhi Paratha',         sellingPrice: 90,  costPrice: 28, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Poha',                  sellingPrice: 60,  costPrice: 15, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Upma',                  sellingPrice: 60,  costPrice: 15, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Idli (2 Pcs)',          sellingPrice: 70,  costPrice: 18, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Medu Vada (2 Pcs)',     sellingPrice: 80,  costPrice: 20, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Plain Dosa',            sellingPrice: 90,  costPrice: 22, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Masala Dosa',           sellingPrice: 120, costPrice: 30, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Bread Omelette',        sellingPrice: 80,  costPrice: 20, isVeg: false, mealTimes: 'BREAKFAST' },
      { name: 'Bread Toast with Butter', sellingPrice: 50, costPrice: 12, isVeg: true, mealTimes: 'BREAKFAST' },
      { name: 'Puri Bhaji (4 Pcs)',    sellingPrice: 90,  costPrice: 25, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Boiled Eggs (2 Pcs)',   sellingPrice: 60,  costPrice: 18, isVeg: false, mealTimes: 'BREAKFAST' },
      { name: 'Scrambled Eggs',        sellingPrice: 90,  costPrice: 22, isVeg: false, mealTimes: 'BREAKFAST' },
      { name: 'French Toast',          sellingPrice: 100, costPrice: 28, isVeg: false, mealTimes: 'BREAKFAST' },
      { name: 'Corn Flakes with Milk', sellingPrice: 80,  costPrice: 22, isVeg: true,  mealTimes: 'BREAKFAST' },
      { name: 'Chole Bhature',         sellingPrice: 120, costPrice: 35, isVeg: true,  mealTimes: 'BREAKFAST,LUNCH' },
    ],
  },

  /* ─── SOUPS ─── */
  {
    name: 'Soups',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Tomato Soup',           sellingPrice: 120, costPrice: 30, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Sweet Corn Soup',       sellingPrice: 130, costPrice: 32, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Mixed Veg Soup',        sellingPrice: 120, costPrice: 28, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Lemon Coriander Soup',  sellingPrice: 120, costPrice: 28, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Soup',          sellingPrice: 160, costPrice: 50, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Manchow Soup (Veg)',    sellingPrice: 140, costPrice: 35, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Manchow Soup (Chicken)', sellingPrice: 170, costPrice: 55, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Hot & Sour Soup (Veg)', sellingPrice: 140, costPrice: 35, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── STARTERS / SNACKS ─── */
  {
    name: 'Starters & Snacks',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Paneer Tikka',          sellingPrice: 280, costPrice: 90,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Hara Bhara Kebab',      sellingPrice: 220, costPrice: 65,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Veg Spring Rolls',      sellingPrice: 180, costPrice: 55,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Crispy Corn',           sellingPrice: 200, costPrice: 55,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Pav Bhaji',             sellingPrice: 140, costPrice: 40,  isVeg: true,  mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Veg Cutlet (2 Pcs)',    sellingPrice: 160, costPrice: 45,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Samosa (2 Pcs)',        sellingPrice: 80,  costPrice: 22,  isVeg: true,  mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'French Fries',          sellingPrice: 160, costPrice: 40,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Garlic Bread',          sellingPrice: 140, costPrice: 38,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Nachos with Salsa',     sellingPrice: 200, costPrice: 55,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Tikka',         sellingPrice: 320, costPrice: 110, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Malai Tikka',   sellingPrice: 350, costPrice: 120, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Tandoori Chicken (Half)',sellingPrice: 380, costPrice: 130, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Wings',         sellingPrice: 280, costPrice: 95,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Fish Fry',              sellingPrice: 300, costPrice: 100, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Prawn Cocktail',        sellingPrice: 350, costPrice: 130, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Seekh Kebab',           sellingPrice: 320, costPrice: 110, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mutton Shammi Kebab',   sellingPrice: 340, costPrice: 120, isVeg: false, mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── MAIN COURSE — VEG ─── */
  {
    name: 'Main Course — Veg',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Dal Makhani',           sellingPrice: 220, costPrice: 60,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Dal Tadka',             sellingPrice: 180, costPrice: 45,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Dal Fry',               sellingPrice: 180, costPrice: 45,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Paneer Butter Masala',  sellingPrice: 300, costPrice: 95,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Shahi Paneer',          sellingPrice: 310, costPrice: 100, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Palak Paneer',          sellingPrice: 290, costPrice: 90,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Kadai Paneer',          sellingPrice: 300, costPrice: 95,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Matar Paneer',          sellingPrice: 270, costPrice: 85,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Aloo Gobi',             sellingPrice: 200, costPrice: 50,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Aloo Matar',            sellingPrice: 200, costPrice: 50,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mix Vegetable Curry',   sellingPrice: 220, costPrice: 55,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Rajma Chawal',          sellingPrice: 220, costPrice: 55,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chole Masala',          sellingPrice: 220, costPrice: 55,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Bhindi Masala',         sellingPrice: 200, costPrice: 50,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Baingan Bharta',        sellingPrice: 210, costPrice: 52,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Saag (Palak/Methi)',    sellingPrice: 210, costPrice: 52,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Kadai Vegetables',      sellingPrice: 230, costPrice: 60,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Navratan Korma',        sellingPrice: 260, costPrice: 75,  isVeg: true, mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── MAIN COURSE — NON VEG ─── */
  {
    name: 'Main Course — Non Veg',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Butter Chicken',        sellingPrice: 360, costPrice: 130, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Curry',         sellingPrice: 320, costPrice: 115, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Kadai',         sellingPrice: 340, costPrice: 120, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Do Pyaza',      sellingPrice: 340, costPrice: 120, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Masala',        sellingPrice: 340, costPrice: 120, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Korma',         sellingPrice: 350, costPrice: 125, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mutton Curry',          sellingPrice: 420, costPrice: 160, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mutton Rogan Josh',     sellingPrice: 440, costPrice: 165, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mutton Keema',          sellingPrice: 400, costPrice: 155, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Egg Curry',             sellingPrice: 220, costPrice: 65,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Egg Bhurji',            sellingPrice: 180, costPrice: 55,  isVeg: false, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Fish Curry',            sellingPrice: 380, costPrice: 140, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Prawn Masala',          sellingPrice: 450, costPrice: 175, isVeg: false, mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── RICE & BIRYANI ─── */
  {
    name: 'Rice & Biryani',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Steamed Rice',          sellingPrice: 100, costPrice: 25,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Jeera Rice',            sellingPrice: 140, costPrice: 35,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Pulao (Veg)',           sellingPrice: 180, costPrice: 45,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Veg Fried Rice',        sellingPrice: 200, costPrice: 55,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Egg Fried Rice',        sellingPrice: 230, costPrice: 65,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Fried Rice',    sellingPrice: 280, costPrice: 90,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Veg Biryani',           sellingPrice: 260, costPrice: 75,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Biryani',       sellingPrice: 360, costPrice: 130, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mutton Biryani',        sellingPrice: 440, costPrice: 165, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Egg Biryani',           sellingPrice: 280, costPrice: 85,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Prawn Biryani',         sellingPrice: 480, costPrice: 185, isVeg: false, mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── BREADS ─── */
  {
    name: 'Indian Breads',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Roti (2 Pcs)',          sellingPrice: 50,  costPrice: 12, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Tawa Roti (2 Pcs)',     sellingPrice: 60,  costPrice: 15, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Naan (2 Pcs)',          sellingPrice: 80,  costPrice: 20, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Butter Naan (2 Pcs)',   sellingPrice: 100, costPrice: 28, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Garlic Naan (2 Pcs)',   sellingPrice: 110, costPrice: 30, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Laccha Paratha (2 Pcs)',sellingPrice: 100, costPrice: 28, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Missi Roti (2 Pcs)',    sellingPrice: 80,  costPrice: 20, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Kulcha (2 Pcs)',        sellingPrice: 100, costPrice: 28, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Puri (4 Pcs)',          sellingPrice: 80,  costPrice: 20, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Parotta (2 Pcs)',       sellingPrice: 80,  costPrice: 22, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
    ],
  },

  /* ─── CHINESE ─── */
  {
    name: 'Chinese',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Veg Noodles',           sellingPrice: 180, costPrice: 50,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Egg Noodles',           sellingPrice: 220, costPrice: 65,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Noodles',       sellingPrice: 260, costPrice: 85,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Veg Chowmein',          sellingPrice: 180, costPrice: 50,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Chowmein',      sellingPrice: 260, costPrice: 85,  isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Veg Manchurian (Gravy)',sellingPrice: 220, costPrice: 60,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Gobi Manchurian',       sellingPrice: 220, costPrice: 60,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Manchurian',    sellingPrice: 300, costPrice: 100, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Chilli Paneer',         sellingPrice: 280, costPrice: 90,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Chilli Chicken',        sellingPrice: 300, costPrice: 100, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Hakka Noodles (Veg)',   sellingPrice: 200, costPrice: 55,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── SNACKS / FAST FOOD ─── */
  {
    name: 'Snacks & Fast Food',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Burger (Veg)',          sellingPrice: 150, costPrice: 45,  isVeg: true,  mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Burger (Chicken)',      sellingPrice: 200, costPrice: 65,  isVeg: false, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Club Sandwich',         sellingPrice: 220, costPrice: 70,  isVeg: false, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Grilled Sandwich (Veg)',sellingPrice: 150, costPrice: 45,  isVeg: true,  mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Pizza (Veg)',           sellingPrice: 280, costPrice: 85,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Pizza (Chicken)',       sellingPrice: 350, costPrice: 120, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Pasta (Veg)',           sellingPrice: 220, costPrice: 65,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Pasta (Arrabbiata)',    sellingPrice: 240, costPrice: 72,  isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Aloo Tikki',           sellingPrice: 80,  costPrice: 22,  isVeg: true,  mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Bhel Puri',            sellingPrice: 80,  costPrice: 22,  isVeg: true,  mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Pani Puri (8 Pcs)',    sellingPrice: 60,  costPrice: 15,  isVeg: true,  mealTimes: 'BREAKFAST,LUNCH,DINNER' },
    ],
  },

  /* ─── THALI / COMBO ─── */
  {
    name: 'Thali & Combo Meals',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Veg Thali',            sellingPrice: 280, costPrice: 90,  isVeg: true,  mealTimes: 'LUNCH,DINNER', description: '3 Sabzi + Dal + Rice + 4 Roti + Salad + Papad' },
      { name: 'Non-Veg Thali',        sellingPrice: 380, costPrice: 140, isVeg: false, mealTimes: 'LUNCH,DINNER', description: '1 Chicken Curry + Dal + Rice + 4 Roti + Salad + Papad' },
      { name: 'Mini Thali (Veg)',      sellingPrice: 180, costPrice: 58,  isVeg: true,  mealTimes: 'LUNCH,DINNER', description: '1 Sabzi + Dal + Rice + 2 Roti' },
      { name: 'South Indian Thali',   sellingPrice: 300, costPrice: 95,  isVeg: true,  mealTimes: 'LUNCH,DINNER', description: 'Sambar + 2 Sabzi + Rice + Curd + Papad + Rasam' },
      { name: 'Meals of the Day',     sellingPrice: 250, costPrice: 80,  isVeg: true,  mealTimes: 'LUNCH,DINNER', description: 'Chef\'s daily special combo' },
    ],
  },

  /* ─── SALADS & RAITA ─── */
  {
    name: 'Salads & Raita',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Green Salad',           sellingPrice: 100, costPrice: 25, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Fruit Salad',           sellingPrice: 150, costPrice: 40, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Boondi Raita',          sellingPrice: 80,  costPrice: 20, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mixed Raita',           sellingPrice: 100, costPrice: 25, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Kachumber Salad',       sellingPrice: 90,  costPrice: 22, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Caesar Salad',          sellingPrice: 200, costPrice: 60, isVeg: true, mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── DESSERTS ─── */
  {
    name: 'Desserts',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Gulab Jamun (2 Pcs)',   sellingPrice: 100, costPrice: 28, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Rasgulla (2 Pcs)',      sellingPrice: 100, costPrice: 28, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Gajar Ka Halwa',        sellingPrice: 130, costPrice: 38, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Kheer',                 sellingPrice: 120, costPrice: 35, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Rasmalai (2 Pcs)',      sellingPrice: 140, costPrice: 42, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Ice Cream (1 Scoop)',   sellingPrice: 100, costPrice: 28, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Ice Cream (2 Scoops)',  sellingPrice: 160, costPrice: 48, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Brownie with Ice Cream',sellingPrice: 200, costPrice: 62, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Fruit Custard',         sellingPrice: 150, costPrice: 45, isVeg: true, mealTimes: 'LUNCH,DINNER' },
    ],
  },

  /* ─── BEVERAGES ─── */
  {
    name: 'Beverages',
    menuType: 'RESTAURANT',
    products: [
      { name: 'Masala Chai',           sellingPrice: 60,  costPrice: 12, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Green Tea',             sellingPrice: 80,  costPrice: 18, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Coffee (Filter/Instant)',sellingPrice: 80,  costPrice: 20, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Cappuccino',            sellingPrice: 140, costPrice: 35, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Cold Coffee',           sellingPrice: 160, costPrice: 40, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Mango Lassi',           sellingPrice: 130, costPrice: 32, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Plain Lassi',           sellingPrice: 100, costPrice: 22, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Sweet Lassi',           sellingPrice: 110, costPrice: 25, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Buttermilk (Chaas)',    sellingPrice: 60,  costPrice: 12, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Fresh Lime Soda',       sellingPrice: 80,  costPrice: 15, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Fresh Lime Water',      sellingPrice: 70,  costPrice: 12, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Mango Juice',           sellingPrice: 120, costPrice: 30, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Orange Juice (Fresh)',  sellingPrice: 130, costPrice: 35, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Watermelon Juice',      sellingPrice: 120, costPrice: 28, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Mineral Water (500ml)', sellingPrice: 30,  costPrice: 10, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Mineral Water (1L)',    sellingPrice: 50,  costPrice: 18, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Soft Drink (Can)',      sellingPrice: 70,  costPrice: 30, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Soft Drink (Bottle)',   sellingPrice: 80,  costPrice: 35, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Milk (Cold / Hot)',     sellingPrice: 80,  costPrice: 20, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
      { name: 'Chocolate Milkshake',   sellingPrice: 180, costPrice: 50, isVeg: true, mealTimes: 'BREAKFAST,LUNCH,DINNER' },
    ],
  },
];

/* ─── Bar Menu ───────────────────────────────────────────────────────────── */
const BAR_MENU: SeedCategory[] = [
  {
    name: 'Whisky',
    menuType: 'BAR',
    products: [
      { name: 'Royal Stag (30ml)',       sellingPrice: 120, costPrice: 38, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Royal Stag (60ml)',       sellingPrice: 220, costPrice: 72, isVeg: true, mealTimes: 'DINNER', pegSize: 60 },
      { name: "Officer's Choice (30ml)", sellingPrice: 100, costPrice: 30, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Black Dog (30ml)',        sellingPrice: 200, costPrice: 65, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Black Dog (60ml)',        sellingPrice: 370, costPrice: 125, isVeg: true, mealTimes: 'DINNER', pegSize: 60 },
      { name: 'Blenders Pride (30ml)',   sellingPrice: 180, costPrice: 58, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Jack Daniels (30ml)',     sellingPrice: 300, costPrice: 100, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: "Johnnie Walker Black (30ml)", sellingPrice: 380, costPrice: 130, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
    ],
  },
  {
    name: 'Vodka',
    menuType: 'BAR',
    products: [
      { name: 'Magic Moments (30ml)',    sellingPrice: 100, costPrice: 30, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Smirnoff (30ml)',         sellingPrice: 180, costPrice: 58, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Absolut (30ml)',          sellingPrice: 240, costPrice: 80, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
    ],
  },
  {
    name: 'Rum',
    menuType: 'BAR',
    products: [
      { name: 'Old Monk (30ml)',         sellingPrice: 100, costPrice: 28, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: "McDowell's No.1 (30ml)", sellingPrice: 90,  costPrice: 25, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Captain Morgan (30ml)',   sellingPrice: 200, costPrice: 65, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
    ],
  },
  {
    name: 'Gin',
    menuType: 'BAR',
    products: [
      { name: 'Bombay Sapphire (30ml)', sellingPrice: 280, costPrice: 95, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: 'Tanqueray (30ml)',        sellingPrice: 300, costPrice: 100, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
      { name: "Gordon's Gin (30ml)",     sellingPrice: 200, costPrice: 65, isVeg: true, mealTimes: 'DINNER', pegSize: 30 },
    ],
  },
  {
    name: 'Beer',
    menuType: 'BAR',
    products: [
      { name: 'Kingfisher Premium (330ml)', sellingPrice: 160, costPrice: 65, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Kingfisher Strong (330ml)',  sellingPrice: 180, costPrice: 75, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Budweiser (330ml)',          sellingPrice: 200, costPrice: 85, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Corona (355ml)',             sellingPrice: 280, costPrice: 120, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Heineken (330ml)',           sellingPrice: 260, costPrice: 110, isVeg: true, mealTimes: 'LUNCH,DINNER' },
    ],
  },
  {
    name: 'Wine',
    menuType: 'BAR',
    products: [
      { name: 'Sula Shiraz (150ml)',     sellingPrice: 350, costPrice: 120, isVeg: true, mealTimes: 'DINNER' },
      { name: 'Sula Sauvignon (150ml)', sellingPrice: 350, costPrice: 120, isVeg: true, mealTimes: 'DINNER' },
      { name: 'Fratelli Sangiovese (150ml)', sellingPrice: 380, costPrice: 130, isVeg: true, mealTimes: 'DINNER' },
      { name: 'House Red Wine (150ml)', sellingPrice: 300, costPrice: 100, isVeg: true, mealTimes: 'DINNER' },
      { name: 'House White Wine (150ml)', sellingPrice: 300, costPrice: 100, isVeg: true, mealTimes: 'DINNER' },
    ],
  },
  {
    name: 'Cocktails & Mocktails',
    menuType: 'BAR',
    products: [
      { name: 'Mojito (Mocktail)',      sellingPrice: 180, costPrice: 50, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Mojito (Classic)',       sellingPrice: 280, costPrice: 90, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Pina Colada',            sellingPrice: 300, costPrice: 100, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Cosmopolitan',           sellingPrice: 300, costPrice: 100, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Margarita',              sellingPrice: 280, costPrice: 92, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Sangria (Glass)',        sellingPrice: 320, costPrice: 110, isVeg: true, mealTimes: 'DINNER' },
      { name: 'Virgin Sangria',         sellingPrice: 200, costPrice: 55, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Blue Lagoon (Mocktail)', sellingPrice: 180, costPrice: 50, isVeg: true, mealTimes: 'LUNCH,DINNER' },
    ],
  },
  {
    name: 'Bar Snacks',
    menuType: 'BAR',
    products: [
      { name: 'Salted Peanuts',         sellingPrice: 80,  costPrice: 20, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Masala Papad',           sellingPrice: 80,  costPrice: 20, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Nachos',                 sellingPrice: 180, costPrice: 50, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
      { name: 'Chicken Wings (6 Pcs)', sellingPrice: 320, costPrice: 110, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Prawn Cocktail',         sellingPrice: 380, costPrice: 140, isVeg: false, mealTimes: 'LUNCH,DINNER' },
      { name: 'Cheese Fries',           sellingPrice: 220, costPrice: 65, isVeg: true,  mealTimes: 'LUNCH,DINNER' },
    ],
  },
  {
    name: 'Bar Mixers & Non-Alcoholic',
    menuType: 'BAR',
    products: [
      { name: 'Soda Water',             sellingPrice: 40,  costPrice: 15, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Tonic Water',            sellingPrice: 50,  costPrice: 20, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Orange Juice',           sellingPrice: 120, costPrice: 35, isVeg: true, mealTimes: 'LUNCH,DINNER' },
      { name: 'Red Bull',               sellingPrice: 180, costPrice: 90, isVeg: true, mealTimes: 'LUNCH,DINNER' },
    ],
  },
];

/* ─── Route Handler ───────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json().catch(() => ({}));
    const propertyId = body.propertyId || (await resolveAdminProperty(session, prisma));
    const menuType: string = body.menuType || 'ALL';

    if (!propertyId) {
      return apiError(new Error('No property context found. Please select a property.'), 400);
    }

    // Choose which menu data to seed
    const menuData: SeedCategory[] = menuType === 'BAR'
      ? BAR_MENU
      : menuType === 'RESTAURANT'
        ? RESTAURANT_MENU
        : [...RESTAURANT_MENU, ...BAR_MENU];

    let categoriesCreated = 0;
    let productsCreated = 0;
    let skipped = 0;

    for (const catData of menuData) {
      // Find or create category
      let category = await prisma.category.findFirst({
        where: { propertyId, name: catData.name },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            propertyId,
            name: catData.name,
            menuType: catData.menuType,
            isActive: true,
          },
        });
        categoriesCreated++;
      }

      // Create products that don't already exist
      for (const p of catData.products) {
        const existing = await prisma.product.findFirst({
          where: { propertyId, name: p.name },
        });
        if (existing) {
          skipped++;
          continue;
        }
        await prisma.product.create({
          data: {
            propertyId,
            categoryId: category.id,
            name: p.name,
            sellingPrice: p.sellingPrice,
            halfPrice: p.halfPrice ?? null,
            costPrice: p.costPrice,
            isVeg: p.isVeg,
            mealTimes: p.mealTimes,
            description: p.description ?? null,
            menuType: p.menuType ?? catData.menuType,
            productType: 'REVENUE',
            isActive: true,
            taxType: 'EXCLUSIVE',
            pegSize: (p as any).pegSize ? Number((p as any).pegSize) : null,
            pegUnit: (p as any).pegSize ? 'ml' : null,
          },
        });
        productsCreated++;
      }
    }

    return apiResponse(
      { categoriesCreated, productsCreated, skipped },
      `Menu seeded: ${categoriesCreated} categories, ${productsCreated} products created (${skipped} skipped)`,
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
