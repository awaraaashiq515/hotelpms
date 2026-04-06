import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);
    const category = await prisma.expenseCategory.update({
      where: { id },
      data,
    });
    return apiResponse(category, 'Category updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { id } = await params;
    // Check if category is in use
    const expenseCount = await prisma.expense.count({ where: { categoryId: id } });
    if (expenseCount > 0) {
      // Soft-delete: just deactivate
      const category = await prisma.expenseCategory.update({
        where: { id },
        data: { isActive: false },
      });
      return apiResponse(category, 'Category deactivated (has linked expenses)');
    }
    await prisma.expenseCategory.delete({ where: { id } });
    return apiResponse(null, 'Category deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
