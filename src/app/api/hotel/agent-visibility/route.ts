import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET /api/hotel/agent-visibility
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    let propertyId = session?.propertyId;

    if (!propertyId) {
      // Find default hotel property
      const defaultProp = await prisma.property.findFirst({
        where: {
          OR: [{ type: 'HOTEL' }, { code: { startsWith: 'HTL' } }],
        },
        select: { id: true, name: true, agentVisibilityDays: true },
      });
      if (defaultProp) {
        return NextResponse.json({
          success: true,
          propertyId: defaultProp.id,
          propertyName: defaultProp.name,
          agentVisibilityDays: defaultProp.agentVisibilityDays || 30,
        });
      }
    }

    const prop = await prisma.property.findUnique({
      where: { id: propertyId || undefined },
      select: { id: true, name: true, agentVisibilityDays: true },
    });

    return NextResponse.json({
      success: true,
      propertyId: prop?.id || propertyId,
      propertyName: prop?.name,
      agentVisibilityDays: prop?.agentVisibilityDays || 30,
    });
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/hotel/agent-visibility
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { days, agentId, propertyId: propIdParam } = body;

    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return NextResponse.json(
        { success: false, message: 'Valid number of days is required.' },
        { status: 400 }
      );
    }

    let propertyId = propIdParam || session?.propertyId;

    if (!propertyId) {
      const defaultProp = await prisma.property.findFirst({
        where: {
          OR: [{ type: 'HOTEL' }, { code: { startsWith: 'HTL' } }],
        },
        select: { id: true },
      });
      propertyId = defaultProp?.id;
    }

    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: 'Hotel property not found.' },
        { status: 404 }
      );
    }

    // 1. If agentId specified, update specific agent relation
    if (agentId) {
      await prisma.agentHotelRelation.upsert({
        where: {
          agentId_propertyId: {
            agentId,
            propertyId,
          },
        },
        create: {
          agentId,
          propertyId,
          allowedDaysAhead: daysNum,
        },
        update: {
          allowedDaysAhead: daysNum,
        },
      });
    }

    // 2. Also update property-wide default
    await prisma.property.update({
      where: { id: propertyId || undefined },
      data: { agentVisibilityDays: daysNum },
    });

    // 3. Update all relations for this property to match if it was a property-wide change
    if (!agentId) {
      await prisma.agentHotelRelation.updateMany({
        where: { propertyId },
        data: { allowedDaysAhead: daysNum },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Calendar visibility set to ${daysNum} days!`,
      agentVisibilityDays: daysNum,
    });
  } catch (error) {
    return apiError(error);
  }
}
