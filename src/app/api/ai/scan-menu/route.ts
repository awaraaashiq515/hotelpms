import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized or no property selected'), 401);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const includeTax = formData.get('includeTax') === 'true';
    const includeHsn = formData.get('includeHsn') === 'true';
    const scanMode = (formData.get('scanMode') as string) || 'semantic';

    if (!file) {
      return apiError(new Error('No image or PDF file uploaded'), 400);
    }

    // 1. Create FormData to forward the file to the local FastAPI backend (port 8000)
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);
    pythonFormData.append('scanMode', scanMode);
    
    const rawOcrText = formData.get('rawOcrText');
    if (rawOcrText) {
      pythonFormData.append('rawOcrText', rawOcrText as string);
    }

    console.log("Forwarding menu image to local FastAPI backend on http://localhost:8000/api/scan-menu...");
    
    // 2. Call local Python FastAPI backend
    const pythonRes = await fetch('http://localhost:8000/api/scan-menu', {
      method: 'POST',
      body: pythonFormData,
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      console.error("Local Python backend error:", errText);
      return apiError(new Error(`Local scanning backend failed: ${errText}`), 500);
    }

    const pythonData = await pythonRes.json();
    console.log("Local Python backend response received successfully!");

    // 3. Map Python backend response schema to Next.js products schema
    const categories = (pythonData.categories || []).map((category: any) => {
      const items = (category.items || []).map((item: any) => {
        const sellingPrice = item.price || 0.0;
        const halfPrice = item.half_price !== undefined && item.half_price !== null ? item.half_price : null;
        const costPrice = Math.round(sellingPrice * 0.4 * 100) / 100; // 40% estimated cost price
        const taxRate = item.gst_rate !== undefined ? item.gst_rate : (includeTax ? 5 : 0);
        const hsnCode = item.hsn_code ? item.hsn_code : (includeHsn ? "9963" : "---");
        
        // Generate high-fidelity unique SKU from category and item name
        const cleanCat = category.category_name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
        const cleanName = item.name.replace(/[^a-zA-Z]/g, '').substring(0, 8).toUpperCase();
        const randId = Math.floor(100 + Math.random() * 900);
        const sku = `${cleanCat}-${cleanName}-${randId}`;
        
        // Generate random 8 digit barcode
        const barcode = Math.floor(10000000 + Math.random() * 90000000).toString();

        return {
          name: item.name,
          sellingPrice,
          halfPrice,
          costPrice,
          hsnCode,
          taxRate,
          sku,
          barcode,
          productType: 'REVENUE_ITEM',
          trackInventory: false,
          isActive: true,
          showInMenu: true,
          description: item.description || `Delicious ${item.name}`,
          isVeg: item.is_vegetarian !== undefined ? Boolean(item.is_vegetarian) : true
        };
      });

      return {
        name: category.category_name,
        items
      };
    });

    const parsedData = { categories };
    return apiResponse(parsedData, 'Menu scanned successfully');

  } catch (error: any) {
    console.error('Next.js Proxy AI Scan Error:', error);
    try {
      const fs = require('fs');
      fs.writeFileSync('/Users/ritchie/Desktop/live website /posendwebsite/scratch/nextjs_error.log', error.stack || error.message);
    } catch (e) {}
    return apiError(new Error(error.message || 'Scanning process failed'), 500);
  }
}
