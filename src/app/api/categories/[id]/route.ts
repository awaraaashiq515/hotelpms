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

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) return apiError(new Error('Category not found'), 404);

    return apiResponse(category);
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
    const { name, description, isActive, menuType } = body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        menuType: menuType !== undefined ? menuType : undefined,
      },
    });

    return apiResponse(category, 'Category updated');
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

    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return apiError(new Error(`Cannot delete category. There are ${productsCount} item(s) tied to it.`), 400);
    }

    await prisma.category.delete({
      where: { id },
    });

    return apiResponse(null, 'Category deleted');
  } catch (error) {
    return apiError(error);
  }
}
