export interface DailyMealItem {
  name: string;
  category?: string;
  isVeg: boolean;
  description?: string;
  price?: number;
}

export interface DailyMealSpread {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'HI_TEA';
  title: string;
  timings: string;
  venue: string;
  description: string;
  isAvailable: boolean;
  coveredInPlans: string[]; // e.g. ['CP', 'MAP', 'AP']
  items: DailyMealItem[];
}

export const DEFAULT_DAILY_MEAL_SPREADS: DailyMealSpread[] = [
  {
    id: 'meal-breakfast',
    mealType: 'BREAKFAST',
    title: 'Sunrise Royal Breakfast Buffet',
    timings: '07:30 AM - 10:30 AM',
    venue: 'The Palm Grove Restaurant & In-Room Dining',
    description: 'Freshly baked breads, live South & North Indian counters, seasonal cut fruits, juices & hot beverages.',
    isAvailable: true,
    coveredInPlans: ['CP', 'MAP', 'AP'],
    items: [
      { name: 'Fluffy Masala Omelette & Scrambled Eggs', category: 'Live Counter', isVeg: false, description: 'Prepared to your choice with cheese, herbs & toast' },
      { name: 'Steaming Hot Idli & Medu Vada', category: 'South Indian', isVeg: true, description: 'Served with homemade coconut chutney & drumstick sambar' },
      { name: 'Crispy Mysore Masala Dosa', category: 'South Indian', isVeg: true, description: 'Golden crepe filled with spiced potato masala' },
      { name: 'Amritsari Aloo & Paneer Paratha', category: 'North Indian', isVeg: true, description: 'Served with fresh curd, butter dollop & pickle' },
      { name: 'Indori Poha & Sev', category: 'Light Bites', isVeg: true, description: 'Tempered flattened rice with peanuts, pomegranate & crunchy sev' },
      { name: 'Seasonal Fresh Fruits Platter', category: 'Healthy & Fresh', isVeg: true, description: 'Papaya, pineapple, watermelon & kiwi slices' },
      { name: 'Fresh Watermelon & Orange Juice', category: 'Beverages', isVeg: true, description: '100% natural, freshly squeezed daily' },
      { name: 'South Indian Filter Coffee & Masala Chai', category: 'Hot Brews', isVeg: true, description: 'Authentic frothy chicory filter brew & ginger cardamom tea' },
    ]
  },
  {
    id: 'meal-lunch',
    mealType: 'LUNCH',
    title: 'Grand Culinary Lunch Buffet',
    timings: '12:30 PM - 03:30 PM',
    venue: 'The Grand Dining Hall & In-Room Dining',
    description: 'Delectable Indian, Mughlai & Pan-Asian spread with live grill, artisanal salads & desserts.',
    isAvailable: true,
    coveredInPlans: ['AP'],
    items: [
      { name: 'Paneer Butter Masala', category: 'Main Course', isVeg: true, description: 'Cottage cheese cubes simmered in rich makhani gravy' },
      { name: 'Murgh Dum Biryani', category: 'Main Course', isVeg: false, description: 'Fragrant Basmati rice cooked on slow flame with tender chicken & spices' },
      { name: 'Slow-Cooked Dal Makhani', category: 'Main Course', isVeg: true, description: 'Black lentils slow cooked overnight with white butter & cream' },
      { name: 'Subz Panchmel (Mix Veg)', category: 'Main Course', isVeg: true, description: 'Farm-fresh garden vegetables tossed in home-ground spice blend' },
      { name: 'Butter Tandoori Roti & Garlic Naan', category: 'Breads', isVeg: true, description: 'Fresh from the clay oven' },
      { name: 'Jeera Pulao & Boondi Raita', category: 'Rice & Accompaniments', isVeg: true, description: 'Aromatic cumin rice with spiced yoghurt' },
      { name: 'Warm Gulab Jamun & Rabri', category: 'Dessert', isVeg: true, description: 'Golden fried dumplings soaked in rose saffron syrup with thickened rabri' },
      { name: 'Fresh Cut Salad & Mint Chutney', category: 'Salads', isVeg: true, description: 'Cucumber, carrot, tomato with lemon dressing' },
    ]
  },
  {
    id: 'meal-dinner',
    mealType: 'DINNER',
    title: 'Executive Candlelight Dinner Spread',
    timings: '07:30 PM - 11:00 PM',
    venue: 'The Palm Court & In-Room Dining',
    description: 'Fine-dining buffet spread featuring live tandoor starters, royal gravies, curries & handcrafted desserts.',
    isAvailable: true,
    coveredInPlans: ['MAP', 'AP'],
    items: [
      { name: 'Paneer Tikka Angara', category: 'Starters', isVeg: true, description: 'Smoky char-grilled cottage cheese with bell peppers' },
      { name: 'Tandoori Murgh (Half)', category: 'Starters', isVeg: false, description: 'Tender chicken marinated in yoghurt and Kashmiri red chillies' },
      { name: 'Kadhai Paneer', category: 'Main Course', isVeg: true, description: 'Cottage cheese tossed with crushed coriander, capsicum & robust tomato gravy' },
      { name: 'Butter Chicken Masala', category: 'Main Course', isVeg: false, description: 'Signature Delhi style boneless chicken in satin smooth tomato gravy' },
      { name: 'Yellow Dal Tadka Double Chaunk', category: 'Main Course', isVeg: true, description: 'Yellow lentils tempered with ghee, cumin, garlic & dried red chillies' },
      { name: 'Hyderabadi Subz Dum Biryani', category: 'Biryani & Rice', isVeg: true, description: 'Basmati rice infused with saffron, caramelized onions & fresh herbs' },
      { name: 'Assorted Breads Basket', category: 'Breads', isVeg: true, description: 'Laccha Paratha, Garlic Naan & Missi Roti' },
      { name: 'Kesar Rasmalai & Chocolate Brownie', category: 'Dessert', isVeg: true, description: 'Spongy cottage cheese patties in saffron milk + warm brownie' },
    ]
  }
];
