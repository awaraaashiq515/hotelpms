import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getMultiTenantWhere } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId') || session.propertyId || undefined;

    const where = getMultiTenantWhere(session, propertyIdParam);

    const [floors, categories, products, outlets, properties] = await Promise.all([
      (prisma as any).floor.findMany({
        where,
        orderBy: { order: 'asc' },
        include: {
          tables: { orderBy: { name: 'asc' } },
        },
      }),
      prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
      }),
      (prisma as any).outlet.findMany({
        where,
        orderBy: { name: 'asc' },
      }),
      // For ADMIN without propertyId, show their properties so they can pick one
      session.role === 'RESTAURANTS_ADMIN' || session.role === 'SUPER_ADMIN'
        ? (prisma as any).property.findMany({
            where: session.role === 'SUPER_ADMIN'
              ? {}
              : { organizationId: session.organizationId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, type: true },
          })
        : Promise.resolve([]),
    ]);

    let finalOutlets = outlets;
    // Self-healing: Create default outlet if none exist for a selected property
    if (propertyIdParam && outlets.length === 0) {
      const newOutlet = await (prisma as any).outlet.create({
        data: {
          name: 'Main Outlet',
          type: 'POS',
          propertyId: propertyIdParam,
        },
      });
      finalOutlets = [newOutlet];
    }

    return NextResponse.json({
      success: true,
      data: {
        floors,
        categories,
        products,
        outlets: finalOutlets,
        properties,
        selectedPropertyId: propertyIdParam || null,
      },
    });
  } catch (error) {
    console.error('Setup data fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
