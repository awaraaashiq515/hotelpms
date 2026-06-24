import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getMultiTenantWhere } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const tabletId = searchParams.get('tabletId');

    let propertyId: string | null = null;

    if (session) {
      let propertyIdParam = searchParams.get('propertyId');
      if (propertyIdParam === 'null' || propertyIdParam === 'undefined' || !propertyIdParam) {
        propertyIdParam = null;
      }
      const where = getMultiTenantWhere(session, propertyIdParam);
      propertyId = where.propertyId || null;
    } else if (tabletId) {
      // Tablet-based auth: resolve propertyId from the tablet
      const tablet = await prisma.tablet.findUnique({ where: { id: tabletId }, include: { property: true } });
      if (tablet) propertyId = tablet.propertyId;
    }

    if (!propertyId && !session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const where = propertyId ? { propertyId, isActive: true } : getMultiTenantWhere(session!, null);
    console.log('[API Drivers] GET Fetching with where:', JSON.stringify(where));

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        _count: {
          select: { posOrders: true, tableReservations: true }
        },
        posOrders: {
          select: { grandTotal: true }
        },
        driverGifts: {
          select: { id: true, ruleId: true, giftName: true, issuedAt: true }
        },
        // @ts-ignore
        offerProgresses: {
          where: { status: 'ACTIVE' },
          include: { offer: true }
        },
        // @ts-ignore
        offerHistories: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedData = drivers.map((d: any) => {
      const totalRevenue = d.posOrders?.reduce((sum: number, order: any) => sum + (order.grandTotal || 0), 0) || 0;
      const activeProgress = d.offerProgresses?.[0] || null;
      const totalWins = d.offerHistories?.length || 0;

      // Remove large/internal payloads from output
      const { posOrders, offerProgresses, offerHistories, ...rest } = d;

      return {
        ...rest,
        referralCount: d._count.posOrders + d._count.tableReservations,
        totalRevenue,
        totalWins,
        activeOffer: activeProgress ? {
          title: activeProgress.offer.title,
          progressPercent: activeProgress.progressPercent,
          completedRides: activeProgress.completedRides,
          completedReferrals: activeProgress.completedReferrals,
          targetRides: activeProgress.offer.targetRides,
          targetReferrals: activeProgress.offer.targetReferrals,
        } : null
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: (error as any).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, phone, vehicleNumber, vehicleType, vehicleCapacity, propertyId: bodyPropertyId } = body;

    let propertyId = session.propertyId || bodyPropertyId;
    
    console.log('[API Drivers] Creating driver with propertyId:',  'session.propertyId:', session.propertyId);

    // Fallback: If no propertyId yet and user is admin, auto-pick the first property in the database
    if (!propertyId && (session.role === 'RESTAURANTS_ADMIN' || session.role === 'SUPER_ADMIN')) {
      const fallbackProp = await prisma.property.findFirst({
        where: session.organizationId ? { organizationId: session.organizationId } : undefined,
        orderBy: { createdAt: 'asc' }
      });
      if (fallbackProp) {
        propertyId = fallbackProp.id;
        console.log('[API Drivers] Auto-picked fallback propertyId:', propertyId);
      }
    }

    if (!propertyId) {
      console.error('[API Drivers] Error: Property ID is required but missing!');
      return NextResponse.json({ success: false, message: 'Property ID is required. Please select a branch first.' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ success: false, message: 'Driver name is required' }, { status: 400 });
    }

    try {
      const newDriver = await prisma.driver.create({
        data: {
          propertyId,
          name,
          phone,
          vehicleNumber,
          vehicleType: vehicleType || 'CAR',
          vehicleCapacity: vehicleCapacity ? parseInt(vehicleCapacity) : null,
          isActive: true,
        }
      });
      console.log('[API Drivers] Successfully created driver:', newDriver.id);

      // AUTO-ONBOARDING: Assign the first slab (Level 1) automatically
      try {
        const firstSlab = await prisma.offer.findFirst({
           where: { propertyId, isActive: true },
           orderBy: { priority: 'asc' }
        });

        if (firstSlab) {
           await (prisma as any).driverOfferProgress.create({
              data: {
                 driverId: newDriver.id,
                 offerId: firstSlab.id,
                 status: 'ACTIVE',
                 completedRides: 0,
                 progressPercent: 0,
                 resetCount: 0
              }
           });
           console.log('[API Drivers] Auto-assigned first slab:', firstSlab.title);
        }
      } catch (autoErr) {
        console.error('[API Drivers] Auto-onboarding error (non-blocking):', autoErr);
        // We don't fail the driver creation if auto-assignment fails
      }

      return NextResponse.json({ success: true, data: newDriver });
    } catch (saveError: any) {
      console.error('[API Drivers] Database Save Error:', saveError);
      return NextResponse.json({ 
        success: false, 
        message: 'Could not save driver to database.', 
        error: saveError.message 
      }, { status: 500 });
    }
  } catch (globalError: any) {
    console.error('[API Drivers] Global Route Error:', globalError);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error', 
      error: globalError.message 
    }, { status: 500 });
  }
}
