import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

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
        ...(status ? { status } : {}),
        ...(date ? dateFilter : {}),
      },
      include: {
        order: {
          select: {
            orderNo: true,
            orderType: true,
            tableNo: true,
            roomId: true,
          }
        },
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 200
    })

    return apiResponse(kots, 'KOTs fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
