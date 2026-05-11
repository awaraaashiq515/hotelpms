import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const combo = await prisma.combo.findUnique({
      where: { id: id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!combo) return apiError(new Error('Combo not found'), 404);

    return apiResponse(combo);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { name, description, price, isActive, items, image } = body;

    // First delete existing items
    await prisma.comboItem.deleteMany({
      where: { comboId: id }
    });

    const combo = await prisma.combo.update({
      where: { id: id },
      data: {
        name,
        description,
        price: parseFloat(price),
        isActive: isActive !== undefined ? isActive : true,
        image,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity) || 1
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return apiResponse(combo, 'Combo updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    await prisma.combo.delete({
      where: { id: id }
    });

    return apiResponse(null, 'Combo deleted');
  } catch (error) {
    return apiError(error);
  }
}
