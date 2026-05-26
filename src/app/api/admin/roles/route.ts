import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    // Dynamic Permission Check
    const hasPermission = session.role === 'SUPER_ADMIN' || session.role === 'RESTAURANTS_ADMIN' || await prisma.rolePermission.findFirst({
      where: { 
        roleId: session.roleId,
        permission: { module: 'Role Management' }
      }
    });

    if (!hasPermission) {
      return apiError(new Error('Unauthorized'), 401);
    }

    let roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    const settings = await prisma.websiteSettings.findFirst();
    const hotelEnabled = settings?.hotelEnabled ?? false;
    if (!hotelEnabled) {
      roles = roles.filter((r: any) => !r.name.toUpperCase().includes('HOTEL'));
    }

    return apiResponse(roles, 'Roles fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}
