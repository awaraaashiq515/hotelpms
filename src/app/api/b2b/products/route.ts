import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const category = searchParams.get('category');
    
    const products = await prisma.b2BProduct.findMany({
      where: {
        ...(supplierId ? { supplierId } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        supplier: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('B2B Products Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplierId, name, description, price, unit, category, image, discount, gstRate, hsnCode, taxType, stockQuantity } = body;

    if (!supplierId || !name || !price || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.b2BProduct.create({
      data: {
        supplierId,
        name,
        description,
        price: parseFloat(price),
        unit,
        category,
        image,
        discount: discount ? parseFloat(discount) : 0,
        gstRate: gstRate ? parseFloat(gstRate) : 18,
        hsnCode: hsnCode || null,
        taxType: taxType || 'Exclusive',
        stockQuantity: parseFloat(stockQuantity) || 0
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Create B2B Product Error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, price, unit, category, image, discount, gstRate, hsnCode, taxType, stockQuantity } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.b2BProduct.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        unit,
        category,
        image,
        discount: discount ? parseFloat(discount) : undefined,
        gstRate: gstRate ? parseFloat(gstRate) : undefined,
        hsnCode: hsnCode !== undefined ? (hsnCode || null) : undefined,
        taxType: taxType || undefined,
        stockQuantity: stockQuantity !== undefined ? parseFloat(stockQuantity) : undefined
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update B2B Product Error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await prisma.b2BProduct.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete B2B Product Error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
