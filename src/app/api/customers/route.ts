import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { processDriverReferral } from '@/lib/driverOfferEngine';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    let organizationId = session?.organizationId;
    
    if (!session) {
      const tabletId = request.nextUrl.searchParams.get('tabletId');
      if (tabletId) {
        const tablet = await prisma.tablet.findUnique({ where: { id: tabletId }, include: { property: true } });
        if (tablet) {
           organizationId = tablet.property.organizationId;
        }
      }
    }

    if (!organizationId) return apiError(new Error('Unauthorized'), 401);

    const customers = await prisma.guest.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        settlements: {
          where: { status: 'PENDING' },
          select: { balanceAmount: true }
        }
      }
    });

    const result = customers.map((c: any) => ({
      ...c,
      pendingBalance: (c as any).settlements.reduce((acc: number, s: any) => acc + (s.balanceAmount || 0), 0)
    }));

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    let organizationId = session?.organizationId;
    
    if (!session) {
      const tabletId = body.tabletId || request.nextUrl.searchParams.get('tabletId');
      if (tabletId) {
        const tablet = await prisma.tablet.findUnique({ where: { id: tabletId }, include: { property: true } });
        if (tablet) {
           organizationId = tablet.property.organizationId;
        }
      }
    }

    if (!organizationId) return apiError(new Error('Unauthorized'), 401);

    const { firstName, lastName, email, mobile, address, gender, birthDate, driverId, referredByCode } = body;

    // Generate unique referral code
    const referralCode = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Check if referred by another customer
    let referredById = undefined;
    if (referredByCode) {
      const referrer = await prisma.guest.findUnique({
        where: { referralCode: referredByCode.trim().toUpperCase() }
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const customer = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        mobile: mobile || null,
        address,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        organizationId,
        referralCode,
        ...(referredById && { referredById }),
        ...(driverId && { driverId })
      },
    });

    if (driverId) {
      processDriverReferral(driverId).catch(err => console.error('Driver Referral Error:', err));
    }

    return apiResponse(customer, 'Customer added successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
