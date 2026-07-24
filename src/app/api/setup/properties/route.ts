import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const propertySchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Property Code must be at least 2 characters'),
  type: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = propertySchema.parse(body)

    const organization = await prisma.organization.findUnique({
      where: { id: parsedData.organizationId },
      include: { package: true }
    });

    if (organization?.package) {
      const existingPropertiesCount = await prisma.property.count({
        where: { organizationId: parsedData.organizationId }
      });
      const propLimit = organization.package.allowedPropertyCount ?? 1;
      if (existingPropertiesCount >= propLimit) {
        return apiError(new Error(`This organization has reached the limit of ${propLimit} property(ies) allowed under their package plan.`), 400);
      }
    }

    const property = await prisma.$transaction(async (tx: any) => {
      const isHotel = parsedData.type === 'HOTEL';

      const p = await tx.property.create({
        data: {
          ...parsedData,
          // Auto-enable HMS for HOTEL type; disable restaurant POS
          hmsEnabled: isHotel ? true : false,
          restaurantPosEnabled: !isHotel,
        },
      })

      // Create a default POS outlet for the new property
      await (tx as any).outlet.create({
        data: {
          name: 'Main Outlet',
          type: isHotel ? 'HOTEL' : 'POS',
          propertyId: p.id,
        },
      })

      return p
    })

    return apiResponse(property, 'Property branch and default outlet created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Security: Restrict non-SUPER_ADMIN users to their own organization's properties
    let finalOrgId = organizationId;
    if (session && session.role !== 'SUPER_ADMIN') {
       finalOrgId = session.organizationId;
    }

    const properties = await prisma.property.findMany({
      where: finalOrgId ? { organizationId: finalOrgId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { rooms: true, outlets: true, users: true }
        }
      }
    })

    return apiResponse(properties, 'Properties fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
