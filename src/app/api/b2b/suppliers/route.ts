import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const suppliers = await prisma.b2BSupplier.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('B2B Suppliers Error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, address, category, image } = body;

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const updatedSupplier = await prisma.b2BSupplier.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        category,
        image
      }
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Update B2B Supplier Error:', error);
    return NextResponse.json({ error: 'Failed to update supplier profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, category, gstNumber } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    // Check if supplier already exists with this email
    const existing = await prisma.b2BSupplier.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json({ error: 'A supplier with this email already exists' }, { status: 400 });
    }

    // Generate random QR token
    const qrToken = 'sup_' + Math.random().toString(36).substring(2, 15);

    const supplier = await prisma.b2BSupplier.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        category: category || null,
        gstNumber: gstNumber || null,
        qrToken,
        qrEnabled: true,
      }
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    console.error('Create B2B Supplier Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create supplier' }, { status: 500 });
  }
}
