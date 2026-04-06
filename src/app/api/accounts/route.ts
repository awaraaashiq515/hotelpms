import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const accounts = await prisma.account.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: {
        accountGroup: true
      }
    });

    return apiResponse(accounts, 'Accounts fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}
