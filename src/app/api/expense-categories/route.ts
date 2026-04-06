import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const categories = await prisma.expenseCategory.findMany({
      where: { propertyId: session.propertyId },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });
    return apiResponse(categories, 'Expense categories fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const body = await request.json();
    const data = categorySchema.parse(body);
    const category = await prisma.expenseCategory.create({
      data: { ...data, propertyId: session.propertyId },
    });
    return apiResponse(category, 'Expense category created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
