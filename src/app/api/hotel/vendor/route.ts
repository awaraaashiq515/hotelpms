import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: Fetch all B2BSuppliers (vendors) with their stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search   = searchParams.get('search');

    const suppliers = await prisma.b2BSupplier.findMany({
      where: {
        ...(category && category !== 'All' ? { category } : {}),
        ...(search ? { name: { contains: search } } : {}),
      },
      include: {
        _count: { select: { orders: true, products: true } },
        orders: {
          select: { totalAmount: true, status: true, rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Shape data for the vendor page
    const vendors = suppliers.map((s) => {
      const totalOrders = s._count.orders;
      const totalValue  = s.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const ratings     = s.orders.filter((o) => o.rating !== null).map((o) => o.rating as number);
      const avgRating   = ratings.length > 0
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 0;
      const pendingOrders = s.orders.filter((o) => o.status === 'PENDING').length;

      return {
        id:           s.id,
        name:         s.name,
        category:     s.category || 'General',
        email:        s.email,
        phone:        s.phone,
        address:      s.address,
        gstNumber:    s.gstNumber,
        image:        s.image,
        isActive:     s.isActive,
        qrEnabled:    s.qrEnabled,
        qrToken:      s.qrToken,
        totalOrders,
        totalValue,
        avgRating,
        pendingOrders,
        productCount: s._count.products,
        createdAt:    s.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: vendors });
  } catch (error) {
    console.error('Hotel Vendor GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

// POST: Create a new B2BSupplier (vendor)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, category, gstNumber } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    const existing = await prisma.b2BSupplier.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A vendor with this email already exists' }, { status: 400 });
    }

    const qrToken = 'sup_' + Math.random().toString(36).substring(2, 15);

    const supplier = await prisma.b2BSupplier.create({
      data: {
        name,
        email,
        phone:     phone     || null,
        address:   address   || null,
        category:  category  || null,
        gstNumber: gstNumber || null,
        qrToken,
        qrEnabled: true,
        isActive:  true,
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    console.error('Hotel Vendor POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create vendor' }, { status: 500 });
  }
}

// PATCH: Update vendor (activate/deactivate or update info)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive, name, phone, address, category, gstNumber } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    const updated = await prisma.b2BSupplier.update({
      where: { id },
      data: {
        ...(name      !== undefined ? { name }      : {}),
        ...(phone     !== undefined ? { phone }     : {}),
        ...(address   !== undefined ? { address }   : {}),
        ...(category  !== undefined ? { category }  : {}),
        ...(gstNumber !== undefined ? { gstNumber } : {}),
        ...(isActive  !== undefined ? { isActive }  : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Hotel Vendor PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vendor' }, { status: 500 });
  }
}
