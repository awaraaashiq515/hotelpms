import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { withGeminiRetry, getGeminiErrorMessage } from '@/lib/gemini-retry';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized or no property selected'), 401);
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'GEMINI_API_KEY' }
    });
    const apiKey = setting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return apiError(new Error('GEMINI_API_KEY is not configured in Admin Settings or .env'), 500);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const includeTax = formData.get('includeTax') === 'true';
    const includeHsn = formData.get('includeHsn') === 'true';

    if (!file) {
      return apiError(new Error('No image or PDF file uploaded'), 400);
    }

    // Convert File to ArrayBuffer then to Base64 Part for Gemini
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `
      Analyze this menu image or PDF and extract all food/beverage items.
      Group items into logical categories. If the menu does NOT have visible categories, **intelligently categorize** them based on their names (e.g., 'Starters', 'Main Course', 'Beverages', 'Desserts').

      For each item, provide the following fields:
      - 'name': Item Name
      - 'sellingPrice': Selling Price (number)
      - 'costPrice': Estimated Cost Price (number, typically 40% of selling price if not visible)
      - 'hsnCode': ${includeHsn ? "Standard 4-digit code (e.g., '2106' for food, '2202' for beverages)" : "Set to '---'"}
      - 'taxRate': ${includeTax ? "Plausible GST percentage (5, 12, or 18) based on typical restaurant norms for that item" : "Set to 0"}
      - 'sku': High-fidelity SKU string (e.g., 'BVG-COKE-500' for Beverages > Coke). Try to make it unique within the menu.
      - 'barcode': Product barcode string (if visible, otherwise generate a unique 8-digit random string).
      - 'productType': Set to 'REVENUE_ITEM' for all menu items.
      - 'trackInventory': Boolean. Use 'true' for bottled drinks/packed items, 'false' for cooked-to-order dishes.
      - 'isActive': Boolean. Always true.
      - 'showInMenu': Boolean. Always true.
      - 'description': Short summary if present.

      Return the data STRICTLY in the following JSON format:
      {
        "categories": [
          {
            "name": "Category Name",
            "items": [
              {
                "name": "Item Name",
                "sellingPrice": 150.00,
                "costPrice": 60.00,
                "hsnCode": "2106",
                "taxRate": 5,
                "sku": "FD-ITEM-01",
                "barcode": "12345678",
                "productType": "REVENUE_ITEM",
                "trackInventory": false,
                "isActive": true,
                "showInMenu": true,
                "description": "Short description"
              }
            ]
          }
        ]
      }
      Rules:
      1. 'sellingPrice', 'costPrice', and 'taxRate' MUST be numbers.
      2. 'trackInventory', 'isActive', and 'showInMenu' MUST be booleans.
      3. Result must be ONLY the JSON object.
    `;

    const result = await withGeminiRetry(() =>
      model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: file.type
          }
        }
      ])
    );

    const text = result.response.text();
    
    // Clean up potential markdown code blocks if Gemini returns them
    const jsonString = text.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(jsonString);

    return apiResponse(parsedData, 'Menu scanned successfully');

  } catch (error: any) {
    console.error('AI Scan Error:', error);
    const message = getGeminiErrorMessage(error);
    return apiError(new Error(message), error?.status === 503 || error?.status === 429 ? 503 : 500);
  }
}
