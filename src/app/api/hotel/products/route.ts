import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

async function getOrCreateCategory(propertyId: string, name: string) {
  let cat = await prisma.category.findFirst({
    where: { propertyId, name: { equals: name } }
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: {
        propertyId,
        name,
        description: `${name} Category`,
        isActive: true,
      }
    });
  }
  return cat.id;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const propertyId = propertyIdParam || session?.propertyId || (session ? await resolveAdminProperty(session, prisma) : null);

    let products = await prisma.product.findMany({
      where: propertyId ? {
        OR: [
          { propertyId },
          { propertyId: '' }
        ]
      } : {},
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    if (products.length === 0 && propertyId) {
      // Seed default product catalog
      const catLinen = await getOrCreateCategory(propertyId, 'Linen & Fabrics');
      const catToiletries = await getOrCreateCategory(propertyId, 'Toiletries & Amenities');
      const catFnB = await getOrCreateCategory(propertyId, 'Food & Beverage');
      const catMinibar = await getOrCreateCategory(propertyId, 'Minibar & Snacks');
      const catHousekeeping = await getOrCreateCategory(propertyId, 'Housekeeping & Cleaning');
      const catStationery = await getOrCreateCategory(propertyId, 'Office & Stationery');

      const defaults = [
        {
          propertyId,
          categoryId: catLinen,
          name: 'Bath Towel (Large Luxury 600 GSM)',
          sku: 'LNN-TOWEL-01',
          barcode: '8901001001',
          productType: 'LINEN',
          costPrice: 350,
          sellingPrice: 850,
          unit: 'Pcs',
          isVeg: true,
          hsnCode: '6302',
          description: 'White combed cotton luxury hotel bath towel',
          isActive: true,
        },
        {
          propertyId,
          categoryId: catLinen,
          name: 'King Size Premium Bed Sheet Set',
          sku: 'LNN-SHEET-02',
          barcode: '8901001002',
          productType: 'LINEN',
          costPrice: 750,
          sellingPrice: 1800,
          unit: 'Set',
          isVeg: true,
          hsnCode: '6302',
          description: '300 TC Satin stripe king size fitted sheet',
          isActive: true,
        },
        {
          propertyId,
          categoryId: catToiletries,
          name: 'Herbal Body Wash & Shampoo (30ml)',
          sku: 'TLT-SHAMPOO-01',
          barcode: '8901002001',
          productType: 'TOILETRIES',
          costPrice: 18,
          sellingPrice: 50,
          unit: 'Bottle',
          isVeg: true,
          hsnCode: '3401',
          description: 'Eco-friendly organic herbal hotel shampoo sachet',
          isActive: true,
        },
        {
          propertyId,
          categoryId: catFnB,
          name: 'Premium Basmati Mineral Water (1L)',
          sku: 'FNB-WATER-01',
          barcode: '8901003001',
          productType: 'BEVERAGE',
          costPrice: 12,
          sellingPrice: 40,
          unit: 'Bottle',
          isVeg: true,
          hsnCode: '2201',
          description: 'Natural mountain spring water in glass bottle',
          isActive: true,
        },
        {
          propertyId,
          categoryId: catMinibar,
          name: 'Roasted Almonds & Cashew Gourmet Pack',
          sku: 'MNB-NUTS-01',
          barcode: '8901004001',
          productType: 'SNACKS',
          costPrice: 65,
          sellingPrice: 180,
          unit: 'Pack',
          isVeg: true,
          hsnCode: '2008',
          description: 'Salted dry roasted mixed nuts for room minibar',
          isActive: true,
        },
        {
          propertyId,
          categoryId: catHousekeeping,
          name: 'Multi-Surface Disinfectant Floor Cleaner (5L)',
          sku: 'HKP-CLEANER-01',
          barcode: '8901005001',
          productType: 'HOUSEKEEPING',
          costPrice: 130,
          sellingPrice: 320,
          unit: 'Can',
          isVeg: true,
          hsnCode: '3402',
          description: 'Concentrated citrus lavender surface sanitizer',
          isActive: true,
        },
        {
          propertyId,
          categoryId: catFnB,
          name: 'Club Sandwich with Peri Peri Fries',
          sku: 'FNB-FOOD-01',
          barcode: '8901003002',
          productType: 'FOOD',
          costPrice: 90,
          sellingPrice: 290,
          unit: 'Portion',
          isVeg: true,
          hsnCode: '2106',
          description: 'Triple decker grilled veg club sandwich',
          isActive: true,
        },
        {
          propertyId,
          categoryId: catStationery,
          name: 'A4 Printing Paper Ream (500 Sheets)',
          sku: 'STN-PAPER-01',
          barcode: '8901006001',
          productType: 'STATIONERY',
          costPrice: 220,
          sellingPrice: 450,
          unit: 'Ream',
          isVeg: true,
          hsnCode: '4802',
          description: '75 GSM high brightness multi-purpose printing paper',
          isActive: true,
        },
      ];

      await prisma.product.createMany({ data: defaults });

      products = await prisma.product.findMany({
        where: { propertyId },
        include: { category: true },
        orderBy: { name: 'asc' },
      });
    }

    return apiResponse(products);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const propertyId = body.propertyId || session?.propertyId || (session ? await resolveAdminProperty(session, prisma) : null);

    if (!propertyId) {
      return apiError(new Error('Property ID is required'), 400);
    }

    const {
      name,
      categoryName = 'General Products',
      productType = 'GENERAL',
      costPrice = 0,
      sellingPrice = 0,
      sku = '',
      barcode = '',
      unit = 'Pcs',
      hsnCode = '',
      description = '',
      isVeg = true,
      isActive = true,
    } = body;

    if (!name || sellingPrice === undefined) {
      return apiError(new Error('Product name and selling price are required'), 400);
    }

    const categoryId = await getOrCreateCategory(propertyId, categoryName);

    const product = await prisma.product.create({
      data: {
        propertyId,
        categoryId,
        name,
        productType,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        barcode: barcode || null,
        unit,
        hsnCode: hsnCode || null,
        description,
        isVeg: Boolean(isVeg),
        isActive: Boolean(isActive),
      },
      include: {
        category: true,
      }
    });

    return apiResponse(product, 'Product created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { id, name, categoryName, productType, costPrice, sellingPrice, sku, barcode, unit, hsnCode, description, isVeg, isActive } = body;

    if (!id) {
      return apiError(new Error('Product ID is required'), 400);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (productType !== undefined) updateData.productType = productType;
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
    if (sellingPrice !== undefined) updateData.sellingPrice = Number(sellingPrice);
    if (sku !== undefined) updateData.sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (unit !== undefined) updateData.unit = unit;
    if (hsnCode !== undefined) updateData.hsnCode = hsnCode;
    if (description !== undefined) updateData.description = description;
    if (isVeg !== undefined) updateData.isVeg = Boolean(isVeg);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (categoryName && body.propertyId) {
      updateData.categoryId = await getOrCreateCategory(body.propertyId, categoryName);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });

    return apiResponse(updated, 'Product updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(new Error('Product ID is required'), 400);
    }

    await prisma.product.delete({
      where: { id }
    });

    return apiResponse({ id }, 'Product deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
