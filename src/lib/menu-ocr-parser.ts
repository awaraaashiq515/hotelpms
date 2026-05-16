/**
 * Menu OCR Parser — Reads menu card images and extracts product data
 * Uses Tesseract.js (100% free, runs in browser)
 * No external API calls needed
 */

export interface ParsedMenuItem {
  name: string;
  price: string;
  category: string;
  unit: string;
  gstRate: string;
  hsnCode: string;
  taxType: string;
}

// Common food category keywords for auto-categorization
const CATEGORY_RULES: { keywords: string[]; category: string; unit: string; gstRate: string; hsnCode: string; taxType: string }[] = [
  { keywords: ['paneer', 'cheese', 'milk', 'curd', 'ghee', 'butter', 'cream', 'yogurt', 'lassi', 'raita', 'dahi'], category: 'Dairy', unit: 'kg', gstRate: '5', hsnCode: '0406', taxType: 'Inclusive' },
  { keywords: ['chicken', 'mutton', 'lamb', 'egg', 'kebab', 'tikka', 'tandoori', 'seekh', 'biryani', 'korma', 'keema'], category: 'Non-Veg', unit: 'pcs', gstRate: '5', hsnCode: '1602', taxType: 'Inclusive' },
  { keywords: ['fish', 'prawn', 'shrimp', 'lobster', 'crab', 'pomfret', 'surmai', 'rohu'], category: 'Seafood', unit: 'pcs', gstRate: '5', hsnCode: '1604', taxType: 'Inclusive' },
  { keywords: ['roti', 'naan', 'paratha', 'kulcha', 'chapati', 'bread', 'puri', 'bhatura', 'rumali', 'tandoori roti', 'garlic naan', 'butter naan', 'laccha'], category: 'Breads', unit: 'pcs', gstRate: '5', hsnCode: '1905', taxType: 'Inclusive' },
  { keywords: ['rice', 'biryani', 'pulao', 'khichdi', 'jeera rice', 'fried rice', 'steamed rice'], category: 'Rice', unit: 'pcs', gstRate: '5', hsnCode: '1006', taxType: 'Inclusive' },
  { keywords: ['dal', 'daal', 'lentil', 'rajma', 'chana', 'chole', 'sambar', 'rasam'], category: 'Dals', unit: 'pcs', gstRate: '5', hsnCode: '0713', taxType: 'Inclusive' },
  { keywords: ['cola', 'pepsi', 'coke', 'sprite', 'fanta', 'limca', 'thums up', 'soda', 'cold drink', 'soft drink', 'juice', 'mojito', 'shake', 'smoothie', 'lemonade', 'chaas', 'buttermilk', 'nimbu pani'], category: 'Beverages', unit: 'pcs', gstRate: '18', hsnCode: '2202', taxType: 'Inclusive' },
  { keywords: ['tea', 'chai', 'coffee', 'cappuccino', 'latte', 'espresso', 'green tea'], category: 'Hot Beverages', unit: 'pcs', gstRate: '5', hsnCode: '2101', taxType: 'Inclusive' },
  { keywords: ['ice cream', 'kulfi', 'falooda', 'sundae', 'gulab jamun', 'rasgulla', 'jalebi', 'halwa', 'kheer', 'rabri', 'brownie', 'cake', 'pastry', 'dessert', 'sweet'], category: 'Desserts', unit: 'pcs', gstRate: '5', hsnCode: '2105', taxType: 'Inclusive' },
  { keywords: ['soup', 'shorba'], category: 'Soups', unit: 'pcs', gstRate: '5', hsnCode: '2104', taxType: 'Inclusive' },
  { keywords: ['salad', 'raita'], category: 'Salads', unit: 'pcs', gstRate: '5', hsnCode: '2005', taxType: 'Inclusive' },
  { keywords: ['samosa', 'pakora', 'vada', 'bhaji', 'fries', 'spring roll', 'momos', 'chaat', 'tikki', 'cutlet', 'manchurian', 'gobi', 'starter', 'appetizer', 'snack', 'papad'], category: 'Starters', unit: 'pcs', gstRate: '5', hsnCode: '2106', taxType: 'Inclusive' },
  { keywords: ['pizza', 'burger', 'sandwich', 'wrap', 'roll', 'frankie', 'pasta', 'noodle', 'maggi', 'chowmein', 'hakka', 'macaroni'], category: 'Fast Food', unit: 'pcs', gstRate: '5', hsnCode: '2106', taxType: 'Inclusive' },
  { keywords: ['thali', 'combo', 'meal', 'platter', 'special'], category: 'Combos', unit: 'pcs', gstRate: '5', hsnCode: '2106', taxType: 'Inclusive' },
  { keywords: ['tomato', 'onion', 'potato', 'capsicum', 'mushroom', 'palak', 'spinach', 'methi', 'aloo', 'gobi', 'baingan', 'bhindi', 'cabbage', 'beans', 'matar', 'vegetable', 'sabzi', 'sabji'], category: 'Vegetables', unit: 'kg', gstRate: '0', hsnCode: '0709', taxType: 'Exempt' },
];

function categorizeItem(name: string): { category: string; unit: string; gstRate: string; hsnCode: string; taxType: string } {
  const lower = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return { category: rule.category, unit: rule.unit, gstRate: rule.gstRate, hsnCode: rule.hsnCode, taxType: rule.taxType };
      }
    }
  }
  // Default: Main Course
  return { category: 'Main Course', unit: 'pcs', gstRate: '5', hsnCode: '2106', taxType: 'Inclusive' };
}

function cleanName(raw: string): string {
  return raw
    .replace(/[\u0900-\u097F]/g, '') // Remove Hindi
    .replace(/[\[\]\(\)\{\}~~|]/g, '') // Remove brackets and symbols
    .replace(/^\d+[\s.]*/, '') // Remove leading numbers (serial nos)
    .replace(/\d{4,}/g, '') // Remove random long numbers (OCR artifacts)
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[.\-_@|#]{1,}$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseMenuText(ocrResult: any): ParsedMenuItem[] {
  const items: ParsedMenuItem[] = [];
  const words = ocrResult.data.words;
  if (!words || words.length === 0) return [];

  // Group words into lines
  const lines: any[][] = [];
  words.forEach((word: any) => {
    const yCenter = (word.bbox.y0 + word.bbox.y1) / 2;
    let foundLine = lines.find(line => {
      const lineY = (line[0].bbox.y0 + line[0].bbox.y1) / 2;
      return Math.abs(yCenter - lineY) < 12; // Tighter threshold
    });
    if (foundLine) foundLine.push(word);
    else lines.push([word]);
  });

  lines.sort((a, b) => a[0].bbox.y0 - b[0].bbox.y0);
  lines.forEach(line => line.sort((a, b) => a.bbox.x0 - b.bbox.x0));

  const pricePattern = /(?:@|₹|rs\.?|inr\.?|price)\s*(\d{2,5}(?:\.\d{1,2})?)(?:\s*\/\s*@?\s*(\d{2,5}(?:\.\d{1,2})?))?/gi;
  const junkWords = ['menu', 'card', 'restaurant', 'hotel', 'today', 'follow', 'instagram', 'facebook', 'note', 'wi-fi', 'special', 'aao', 'tusso'];

  lines.forEach(lineWords => {
    // 1. Split by large horizontal gap
    const segments: any[][] = [[]];
    for (let i = 0; i < lineWords.length; i++) {
      const word = lineWords[i];
      if (i > 0 && (word.bbox.x0 - lineWords[i-1].bbox.x1) > 50) { // Lower threshold
        segments.push([word]);
      } else {
        segments[segments.length - 1].push(word);
      }
    }

    segments.forEach(seg => {
      const segmentText = seg.map(w => w.text).join(' ').trim();
      if (segmentText.length < 4) return;
      if (junkWords.some(jw => segmentText.toLowerCase().includes(jw))) return;

      // 2. Split by multiple price matches (Crucial for merged columns)
      const matches = Array.from(segmentText.matchAll(pricePattern));
      
      if (matches.length > 0) {
        let lastEnd = 0;
        matches.forEach((match, index) => {
          const matchStart = match.index!;
          const matchEnd = matchStart + match[0].length;
          
          // Name is text between previous match end and current match start
          let namePart = segmentText.substring(lastEnd, matchStart).trim();
          
          // If name is empty, it might be the start of the line or attached to the price
          if (!namePart && index === 0) {
             // Skip or handle
          }

          const p1 = match[1];
          const p2 = match[2];
          const finalPrice = p2 || p1;
          const cleaned = cleanName(namePart);

          if (cleaned.length > 2 && !/^[A-Z\s#]{3,}$/.test(cleaned)) {
            if (!items.some(it => it.name === cleaned)) {
              items.push({ name: cleaned, price: finalPrice, ...categorizeItem(cleaned) });
            }
          }
          lastEnd = matchEnd;
        });
      }
    });
  });

  return items;
}

export async function extractTextFromImage(imageFile: File, onProgress?: (p: number) => void): Promise<any> {
  const { createWorker } = await import('tesseract.js');
  
  const worker = await createWorker('eng+hin', 1, {
    logger: (m: any) => {
      if (m.status === 'loading tesseract core') onProgress?.(10);
      if (m.status === 'initializing tesseract') onProgress?.(20);
      if (m.status === 'initializing api') onProgress?.(30);
      if (m.status === 'loading language traineddata') onProgress?.(40);
      if (m.status === 'recognizing text') {
        const progress = 40 + Math.round(m.progress * 60);
        onProgress?.(progress);
      }
    },
  });

  try {
    const result = await worker.recognize(imageFile);
    await worker.terminate();
    return result;
  } catch (error) {
    console.error('Tesseract error:', error);
    await worker.terminate();
    throw error;
  }
}
