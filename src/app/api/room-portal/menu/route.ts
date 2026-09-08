import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function GET(request: NextRequest) {
  try {
    let propertyId: string | null = null;

    // 1. Try JWT Bearer or Cookie
    const authHeader = request.headers.get('Authorization') || '';
    const cookieToken = request.cookies.get('room_portal_session')?.value;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, key);
        propertyId = (payload.propertyId as string) || null;
      } catch {}
    }

    // 2. Query param fallback (propertyCode or propertyId)
    const url = new URL(request.url);
    const queryPropCode = url.searchParams.get('propertyCode');
    const queryPropId = url.searchParams.get('propertyId');

    // Find the base hotel or restaurant property
    let baseProperty: any = null;
    if (queryPropCode) {
      baseProperty = await prisma.property.findFirst({
        where: {
          OR: [
            { code: queryPropCode },
            { code: queryPropCode.toUpperCase() },
            { code: queryPropCode.toLowerCase() },
          ],
        },
        select: { id: true, code: true, name: true, organizationId: true, type: true },
      });
    }

    if (!baseProperty && (propertyId || queryPropId)) {
      const pid = propertyId || queryPropId!;
      baseProperty = await prisma.property.findUnique({
        where: { id: pid },
        select: { id: true, code: true, name: true, organizationId: true, type: true },
      });
    }

    // 3. Resolve target property IDs (strictly pointing to restaurant outlet e.g. RCH002)
    let targetPropertyIds: string[] = [];
    if (baseProperty) {
      if (baseProperty.type === 'RESTAURANT') {
        // If already restaurant (e.g. RCH002), use it directly
        targetPropertyIds = [baseProperty.id];
      } else {
        // Hotel property: find the linked restaurant outlet in the same organization
        const restaurantProp = await prisma.property.findFirst({
          where: {
            organizationId: baseProperty.organizationId,
            OR: [
              { type: 'RESTAURANT' },
              { code: 'RCH002' },
              { code: { contains: '002' } },
            ],
          },
          select: { id: true, code: true, name: true },
        });

        if (restaurantProp) {
          const restProdCount = await prisma.product.count({
            where: { propertyId: restaurantProp.id, isActive: true },
          });
          if (restProdCount > 0) {
            // Restaurant has products: show ONLY restaurant products (e.g. from RCH002)
            targetPropertyIds = [restaurantProp.id];
          } else {
            // Fallback: also include hotel products if restaurant is still empty
            targetPropertyIds = [restaurantProp.id, baseProperty.id];
          }
        } else {
          targetPropertyIds = [baseProperty.id];
        }
      }
    } else {
      // Fallback: find any property with active restaurant products
      const sample = await prisma.product.findFirst({
        where: { isActive: true, menuType: 'RESTAURANT' },
        select: { propertyId: true },
      });
      if (sample?.propertyId) targetPropertyIds = [sample.propertyId];
    }

    if (targetPropertyIds.length === 0) {
      return NextResponse.json({ success: true, data: [], items: [] });
    }

    // Fetch active products configured in POS / restaurant system
    const products = await prisma.product.findMany({
      where: {
        propertyId: { in: targetPropertyIds },
        isActive: true,
        availabilityStatus: true,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const EXCLUDED_CATEGORIES = [
      'linen & fabrics',
      'linen',
      'housekeeping & cleaning',
      'housekeeping',
      'cleaning',
      'office & stationery',
      'stationery',
      'toiletries & amenities',
      'toiletries',
      'amenities',
      'laundry items',
      'laundry',
      'assets & equipment',
      'assets',
      'maintenance',
    ];

    const foodProducts = products.filter((p) => {
      const cat = (p.category?.name || '').toLowerCase();
      return !EXCLUDED_CATEGORIES.some((exc) => cat.includes(exc));
    });

    const items = foodProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sellingPrice: p.sellingPrice,
      description: p.description || '',
      image: p.image || null,
      isVeg: p.isVeg !== false,
      category: p.category ? { name: p.category.name } : { name: 'Food & Beverage' },
      menuType: p.menuType,
    }));

    return NextResponse.json({
      success: true,
      data: items,
      items,
    });
  } catch (error: any) {
    console.error('[Room Portal Menu API Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load menu' },
      { status: 500 }
    );
  }
}
