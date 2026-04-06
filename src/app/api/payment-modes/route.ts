import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const modes = await prisma.paymentMode.findMany({
      where: { propertyId: session.propertyId as string },
      orderBy: { name: 'asc' },
    });

    return apiResponse(modes);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { name, type } = body;

    const mode = await prisma.paymentMode.create({
      data: {
        name,
        type: type || 'Cash',
        propertyId: session.propertyId as string,
      },
    });

    return apiResponse(mode, 'Payment mode created', 201);
  } catch (error) {
    return apiError(error);
  }
}
