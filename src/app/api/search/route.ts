import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) return apiResponse([]);

    const orgId = session.organizationId;

    const [products, staff, guests] = await Promise.all([
      prisma.product.findMany({
        where: { 
          property: { organizationId: orgId }, 
          name: { contains: query } 
        },
        take: 3,
      }),
      prisma.user.findMany({
        where: { organizationId: orgId, fullName: { contains: query } },
        take: 3,
      }),
      prisma.guest.findMany({
        where: { 
          organizationId: orgId, 
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } }
          ]
        },
        take: 3,
      }),
    ]);

    const results = [
      ...products.map(p => ({ id: p.id, type: 'Product', title: p.name, url: '/products' })),
      ...staff.map(s => ({ id: s.id, type: 'Staff', title: s.fullName, url: '/staff' })),
      ...guests.map(c => ({ id: c.id, type: 'Customer', title: `${c.firstName} ${c.lastName || ''}`, url: '/customers' })),
    ];

    return apiResponse(results);
  } catch (error) {
    return apiError(error);
  }
}
