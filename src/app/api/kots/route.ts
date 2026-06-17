import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url)
    const propertyIdParam = searchParams.get('propertyId')
    const outletId = searchParams.get('outletId')
    const status = searchParams.get('status')
    const date = searchParams.get('date') // Format: YYYY-MM-DD

    const where: any = getMultiTenantWhere(session, propertyIdParam);

    // Build date-range filter if date param provided
    let dateFilter = {}
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      dateFilter = { createdAt: { gte: start, lte: end } }
    }

    const kots = await (prisma as any).kotTicket.findMany({
      where: {
        ...where,
        ...(outletId ? { outletId } : {}),
        ...(status ? { status } : { status: { not: 'PRINTED_ONLY' } }),
        ...(date ? dateFilter : {}),
      },
      include: {
        order: {
          select: {
            orderNo: true,
            orderType: true,
            tableNo: true,
            roomId: true,
            preparationTime: true,
          }
        },
        table: {
          include: { floor: true }
        },
        items: {
          include: {
            product: { select: { name: true, menuType: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    })

    const menuType = searchParams.get('menuType')
    const excludeMenuType = searchParams.get('excludeMenuType')

    let filteredKots = kots;

    if (menuType) {
      filteredKots = kots.map((kot: any) => ({
        ...kot,
        items: (kot.items || []).filter((item: any) => item.product?.menuType === menuType)
      })).filter((kot: any) => kot.items.length > 0);
    } else if (excludeMenuType) {
      filteredKots = kots.map((kot: any) => ({
        ...kot,
        items: (kot.items || []).filter((item: any) => item.product?.menuType !== excludeMenuType)
      })).filter((kot: any) => kot.items.length > 0);
    }

    return apiResponse(filteredKots, 'KOTs fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const hours = searchParams.get('hours');
    const clearAll = searchParams.get('all') === 'true';

    const where: any = getMultiTenantWhere(session, propertyIdParam);

    if (clearAll) {
      // Delete all KOTs for the property
      await (prisma as any).kotTicket.deleteMany({
        where: where
      });
      return apiResponse(null, 'All KOTs cleared successfully');
    }

    if (hours) {
      const threshold = new Date();
      threshold.setHours(threshold.getHours() - parseInt(hours));

      await (prisma as any).kotTicket.deleteMany({
        where: {
          ...where,
          createdAt: { lt: threshold }
        }
      });
      return apiResponse(null, `KOTs older than ${hours} hours cleared successfully`);
    }

    return apiError(new Error('Invalid cleanup parameters'), 400);
  } catch (error) {
    return apiError(error);
  }
}
