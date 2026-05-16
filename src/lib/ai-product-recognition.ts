/**
 * B2B Product AI Recognition System
 * Uses TensorFlow.js + MobileNet to detect products from images
 * Runs entirely in-browser — No external API calls
 */

// Product mapping: MobileNet label → Product details
const PRODUCT_MAP: Record<string, { name: string; category: string; unit: string; gstRate: string; hsnCode: string; taxType: string }> = {
  // Vegetables
  'bell pepper': { name: 'Fresh Bell Pepper', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'mushroom': { name: 'Button Mushroom', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'broccoli': { name: 'Fresh Broccoli', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0704', taxType: 'Exempt' },
  'cauliflower': { name: 'Fresh Cauliflower', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0704', taxType: 'Exempt' },
  'cucumber': { name: 'Fresh Cucumber', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0707', taxType: 'Exempt' },
  'zucchini': { name: 'Fresh Zucchini', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'artichoke': { name: 'Fresh Artichoke', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'cardoon': { name: 'Cardoon', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'spaghetti squash': { name: 'Spaghetti Squash', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'acorn squash': { name: 'Acorn Squash', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'butternut squash': { name: 'Butternut Squash', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'head cabbage': { name: 'Fresh Cabbage', category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0704', taxType: 'Exempt' },

  // Fruits
  'banana': { name: 'Fresh Banana', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0803', taxType: 'Exempt' },
  'strawberry': { name: 'Fresh Strawberry', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0810', taxType: 'Exempt' },
  'orange': { name: 'Fresh Orange', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0805', taxType: 'Exempt' },
  'lemon': { name: 'Fresh Lemon', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0805', taxType: 'Exempt' },
  'pineapple': { name: 'Fresh Pineapple', category: 'Fruits', unit: 'pcs', gstRate: '0', hsnCode: '0804', taxType: 'Exempt' },
  'fig': { name: 'Fresh Fig', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0804', taxType: 'Exempt' },
  'pomegranate': { name: 'Fresh Pomegranate', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0810', taxType: 'Exempt' },
  'Granny Smith': { name: 'Green Apple', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0808', taxType: 'Exempt' },
  'jackfruit': { name: 'Jackfruit', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0810', taxType: 'Exempt' },
  'custard apple': { name: 'Custard Apple', category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0810', taxType: 'Exempt' },

  // Meat & Poultry
  'meat loaf': { name: 'Meat Loaf', category: 'Meat', unit: 'kg', gstRate: '12', hsnCode: '0201', taxType: 'Exclusive' },
  'hen': { name: 'Whole Chicken', category: 'Poultry', unit: 'kg', gstRate: '12', hsnCode: '0207', taxType: 'Exclusive' },
  'cock': { name: 'Country Chicken', category: 'Poultry', unit: 'kg', gstRate: '12', hsnCode: '0207', taxType: 'Exclusive' },
  'turkey': { name: 'Turkey Meat', category: 'Poultry', unit: 'kg', gstRate: '12', hsnCode: '0207', taxType: 'Exclusive' },
  'drumstick': { name: 'Chicken Drumstick', category: 'Poultry', unit: 'kg', gstRate: '12', hsnCode: '0207', taxType: 'Exclusive' },

  // Dairy
  'milk can': { name: 'Fresh Milk', category: 'Dairy', unit: 'litre', gstRate: '0', hsnCode: '0401', taxType: 'Exempt' },
  'butter': { name: 'Fresh Butter', category: 'Dairy', unit: 'kg', gstRate: '12', hsnCode: '0405', taxType: 'Exclusive' },
  'ice cream': { name: 'Ice Cream', category: 'Dairy', unit: 'litre', gstRate: '18', hsnCode: '2105', taxType: 'Inclusive' },

  // Grocery & Bakery
  'dough': { name: 'Fresh Dough', category: 'Grocery', unit: 'kg', gstRate: '5', hsnCode: '1901', taxType: 'Inclusive' },
  'bagel': { name: 'Fresh Bagel', category: 'Grocery', unit: 'pcs', gstRate: '5', hsnCode: '1905', taxType: 'Inclusive' },
  'pretzel': { name: 'Pretzel', category: 'Grocery', unit: 'pcs', gstRate: '5', hsnCode: '1905', taxType: 'Inclusive' },
  'French loaf': { name: 'French Bread', category: 'Grocery', unit: 'pcs', gstRate: '5', hsnCode: '1905', taxType: 'Inclusive' },
  'pizza': { name: 'Pizza Base', category: 'Grocery', unit: 'pcs', gstRate: '18', hsnCode: '1905', taxType: 'Inclusive' },
  'burrito': { name: 'Tortilla Wrap', category: 'Grocery', unit: 'packet', gstRate: '12', hsnCode: '1905', taxType: 'Inclusive' },
  'espresso': { name: 'Coffee Beans', category: 'Grocery', unit: 'kg', gstRate: '5', hsnCode: '0901', taxType: 'Exclusive' },
  'cup': { name: 'Paper Cups', category: 'Grocery', unit: 'packet', gstRate: '18', hsnCode: '4823', taxType: 'Exclusive' },

  // Beverages
  'water bottle': { name: 'Packaged Water', category: 'Beverages', unit: 'crate', gstRate: '18', hsnCode: '2201', taxType: 'Inclusive' },
  'pop bottle': { name: 'Soft Drink', category: 'Beverages', unit: 'crate', gstRate: '28', hsnCode: '2202', taxType: 'Inclusive' },
  'wine bottle': { name: 'Wine', category: 'Beverages', unit: 'pcs', gstRate: '28', hsnCode: '2204', taxType: 'Inclusive' },
  'beer bottle': { name: 'Beer', category: 'Beverages', unit: 'crate', gstRate: '28', hsnCode: '2203', taxType: 'Inclusive' },
  'red wine': { name: 'Red Wine', category: 'Beverages', unit: 'pcs', gstRate: '28', hsnCode: '2204', taxType: 'Inclusive' },
  'eggnog': { name: 'Eggnog', category: 'Beverages', unit: 'litre', gstRate: '12', hsnCode: '2202', taxType: 'Inclusive' },

  // Spices & Condiments
  'hot pot': { name: 'Masala Mix', category: 'Spices', unit: 'kg', gstRate: '5', hsnCode: '0910', taxType: 'Exclusive' },

  // Packaging & Supplies
  'packet': { name: 'Packaging Material', category: 'Supplies', unit: 'packet', gstRate: '18', hsnCode: '3923', taxType: 'Exclusive' },
  'envelope': { name: 'Paper Envelopes', category: 'Supplies', unit: 'packet', gstRate: '12', hsnCode: '4817', taxType: 'Exclusive' },
  'plastic bag': { name: 'Carry Bags', category: 'Supplies', unit: 'packet', gstRate: '18', hsnCode: '3923', taxType: 'Exclusive' },

  // Seafood
  'crayfish': { name: 'Fresh Crayfish', category: 'Seafood', unit: 'kg', gstRate: '5', hsnCode: '0306', taxType: 'Exclusive' },
  'lobster': { name: 'Fresh Lobster', category: 'Seafood', unit: 'kg', gstRate: '5', hsnCode: '0306', taxType: 'Exclusive' },
  'flatworm': { name: 'Fresh Prawns', category: 'Seafood', unit: 'kg', gstRate: '5', hsnCode: '0306', taxType: 'Exclusive' },
};

// Category keywords for fuzzy matching
const CATEGORY_KEYWORDS: Record<string, { category: string; unit: string; gstRate: string; hsnCode: string; taxType: string }> = {
  // Vegetable keywords
  'vegetable': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'pepper': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'potato': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0701', taxType: 'Exempt' },
  'onion': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0703', taxType: 'Exempt' },
  'tomato': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0702', taxType: 'Exempt' },
  'carrot': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0706', taxType: 'Exempt' },
  'corn': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0710', taxType: 'Exempt' },
  'cabbage': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0704', taxType: 'Exempt' },
  'lettuce': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0705', taxType: 'Exempt' },
  'spinach': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'garlic': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0703', taxType: 'Exempt' },
  'ginger': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0910', taxType: 'Exempt' },
  'pea': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0708', taxType: 'Exempt' },
  'bean': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0708', taxType: 'Exempt' },
  'squash': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'gourd': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
  'radish': { category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0706', taxType: 'Exempt' },

  // Fruit keywords
  'fruit': { category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0810', taxType: 'Exempt' },
  'apple': { category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0808', taxType: 'Exempt' },
  'mango': { category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0804', taxType: 'Exempt' },
  'grape': { category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0806', taxType: 'Exempt' },
  'watermelon': { category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0807', taxType: 'Exempt' },
  'cherry': { category: 'Fruits', unit: 'kg', gstRate: '0', hsnCode: '0809', taxType: 'Exempt' },

  // Meat keywords
  'meat': { category: 'Meat', unit: 'kg', gstRate: '12', hsnCode: '0201', taxType: 'Exclusive' },
  'chicken': { category: 'Poultry', unit: 'kg', gstRate: '12', hsnCode: '0207', taxType: 'Exclusive' },
  'pork': { category: 'Meat', unit: 'kg', gstRate: '12', hsnCode: '0203', taxType: 'Exclusive' },
  'beef': { category: 'Meat', unit: 'kg', gstRate: '12', hsnCode: '0201', taxType: 'Exclusive' },
  'lamb': { category: 'Meat', unit: 'kg', gstRate: '12', hsnCode: '0204', taxType: 'Exclusive' },
  'mutton': { category: 'Meat', unit: 'kg', gstRate: '12', hsnCode: '0204', taxType: 'Exclusive' },
  'fish': { category: 'Seafood', unit: 'kg', gstRate: '5', hsnCode: '0302', taxType: 'Exclusive' },
  'prawn': { category: 'Seafood', unit: 'kg', gstRate: '5', hsnCode: '0306', taxType: 'Exclusive' },
  'shrimp': { category: 'Seafood', unit: 'kg', gstRate: '5', hsnCode: '0306', taxType: 'Exclusive' },
  'egg': { category: 'Poultry', unit: 'crate', gstRate: '0', hsnCode: '0407', taxType: 'Exempt' },

  // Dairy keywords
  'milk': { category: 'Dairy', unit: 'litre', gstRate: '0', hsnCode: '0401', taxType: 'Exempt' },
  'cheese': { category: 'Dairy', unit: 'kg', gstRate: '12', hsnCode: '0406', taxType: 'Exclusive' },
  'yogurt': { category: 'Dairy', unit: 'kg', gstRate: '5', hsnCode: '0403', taxType: 'Inclusive' },
  'curd': { category: 'Dairy', unit: 'kg', gstRate: '0', hsnCode: '0403', taxType: 'Exempt' },
  'cream': { category: 'Dairy', unit: 'litre', gstRate: '12', hsnCode: '0401', taxType: 'Exclusive' },
  'paneer': { category: 'Dairy', unit: 'kg', gstRate: '0', hsnCode: '0406', taxType: 'Exempt' },
  'ghee': { category: 'Dairy', unit: 'litre', gstRate: '12', hsnCode: '0405', taxType: 'Exclusive' },

  // Grocery keywords
  'bread': { category: 'Grocery', unit: 'pcs', gstRate: '0', hsnCode: '1905', taxType: 'Exempt' },
  'rice': { category: 'Grocery', unit: 'kg', gstRate: '0', hsnCode: '1006', taxType: 'Exempt' },
  'flour': { category: 'Grocery', unit: 'kg', gstRate: '0', hsnCode: '1101', taxType: 'Exempt' },
  'sugar': { category: 'Grocery', unit: 'kg', gstRate: '5', hsnCode: '1701', taxType: 'Exclusive' },
  'salt': { category: 'Grocery', unit: 'kg', gstRate: '0', hsnCode: '2501', taxType: 'Exempt' },
  'oil': { category: 'Grocery', unit: 'litre', gstRate: '5', hsnCode: '1508', taxType: 'Exclusive' },
  'noodle': { category: 'Grocery', unit: 'packet', gstRate: '12', hsnCode: '1902', taxType: 'Inclusive' },
  'pasta': { category: 'Grocery', unit: 'packet', gstRate: '12', hsnCode: '1902', taxType: 'Inclusive' },
  'sauce': { category: 'Grocery', unit: 'pcs', gstRate: '12', hsnCode: '2103', taxType: 'Inclusive' },
  'ketchup': { category: 'Grocery', unit: 'pcs', gstRate: '12', hsnCode: '2103', taxType: 'Inclusive' },
  'spice': { category: 'Spices', unit: 'kg', gstRate: '5', hsnCode: '0910', taxType: 'Exclusive' },
  'tea': { category: 'Grocery', unit: 'kg', gstRate: '5', hsnCode: '0902', taxType: 'Exclusive' },
  'coffee': { category: 'Grocery', unit: 'kg', gstRate: '5', hsnCode: '0901', taxType: 'Exclusive' },

  // Beverages keywords
  'juice': { category: 'Beverages', unit: 'litre', gstRate: '12', hsnCode: '2009', taxType: 'Inclusive' },
  'water': { category: 'Beverages', unit: 'crate', gstRate: '18', hsnCode: '2201', taxType: 'Inclusive' },
  'soda': { category: 'Beverages', unit: 'crate', gstRate: '28', hsnCode: '2202', taxType: 'Inclusive' },
  'drink': { category: 'Beverages', unit: 'crate', gstRate: '18', hsnCode: '2202', taxType: 'Inclusive' },
  'bottle': { category: 'Beverages', unit: 'crate', gstRate: '18', hsnCode: '2201', taxType: 'Inclusive' },
};

export interface ProductPrediction {
  name: string;
  category: string;
  unit: string;
  gstRate: string;
  hsnCode: string;
  taxType: string;
  confidence: number;
  rawLabel: string;
}

let model: any = null;
let isLoading = false;

export async function loadModel(): Promise<boolean> {
  if (model) return true;
  if (isLoading) return false;
  
  isLoading = true;
  try {
    const tf = await import('@tensorflow/tfjs');
    const mobilenet = await import('@tensorflow-models/mobilenet');
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    isLoading = false;
    return true;
  } catch (error) {
    console.error('Failed to load AI model:', error);
    isLoading = false;
    return false;
  }
}

export function isModelLoaded(): boolean {
  return !!model;
}

export async function recognizeProduct(imageElement: HTMLImageElement): Promise<ProductPrediction | null> {
  if (!model) {
    const loaded = await loadModel();
    if (!loaded) return null;
  }

  try {
    const predictions = await model.classify(imageElement, 5);
    
    if (!predictions || predictions.length === 0) return null;

    // Try each prediction for a match
    for (const pred of predictions) {
      const label = pred.className.toLowerCase();
      
      // Direct match in PRODUCT_MAP
      for (const [key, val] of Object.entries(PRODUCT_MAP)) {
        if (label.includes(key.toLowerCase())) {
          return {
            ...val,
            confidence: Math.round(pred.probability * 100),
            rawLabel: pred.className
          };
        }
      }

      // Fuzzy match using keyword lookup
      for (const [keyword, val] of Object.entries(CATEGORY_KEYWORDS)) {
        if (label.includes(keyword)) {
          // Build a display name from the raw label
          const words = pred.className.split(',')[0].trim();
          const displayName = words.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return {
            name: `Fresh ${displayName}`,
            ...val,
            confidence: Math.round(pred.probability * 100),
            rawLabel: pred.className
          };
        }
      }
    }

    // Fallback: use the top prediction label even if no category match
    const topPred = predictions[0];
    const displayName = topPred.className.split(',')[0].trim();
    const formatted = displayName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
      name: formatted,
      category: 'Grocery',
      unit: 'pcs',
      gstRate: '18',
      hsnCode: '',
      taxType: 'Exclusive',
      confidence: Math.round(topPred.probability * 100),
      rawLabel: topPred.className
    };
  } catch (error) {
    console.error('AI recognition error:', error);
    return null;
  }
}
