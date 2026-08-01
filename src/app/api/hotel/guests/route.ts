import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const search  = searchParams.get('search') || '';
    const segment = searchParams.get('segment') || '';
    const page    = parseInt(searchParams.get('page') || '1');
    const limit   = parseInt(searchParams.get('limit') || '50');
    const skip    = (page - 1) * limit;

    const where: any = { organizationId: session.organizationId };
    if (segment) where.segment = segment;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName:  { contains: search } },
        { mobile:    { contains: search } },
        { email:     { contains: search } },
      ];
    }

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: { reservations: { select: { id: true, status: true, totalAmount: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.guest.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: guests, total, page, limit });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      mobile, 
      email, 
      gender, 
      nationality, 
      idType, 
      idNumber, 
      address, 
      segment = 'REGULAR',
      loyaltyPoints = 0,
    } = body;

    if (!firstName) {
      return NextResponse.json({ success: false, message: 'First name is required.' }, { status: 400 });
    }

    // Check if guest with same mobile already exists in organization
    if (mobile) {
      const existing = await prisma.guest.findFirst({
        where: {
          organizationId: session.organizationId,
          mobile,
        }
      });
      if (existing) {
        return NextResponse.json({ success: false, message: `A guest with mobile ${mobile} already exists.` }, { status: 400 });
      }
    }

    const guest = await prisma.guest.create({
      data: {
        organizationId: session.organizationId,
        firstName,
        lastName: lastName || null,
        mobile: mobile || null,
        email: email || null,
        gender: gender || null,
        nationality: nationality || null,
        idType: idType || null,
        idNumber: idNumber || null,
        address: address || null,
        segment: segment || 'REGULAR',
        loyaltyPoints: Number(loyaltyPoints || 0),
      }
    });

    return NextResponse.json({ success: true, data: guest, message: 'Guest added successfully!' });
  } catch (error: any) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, loyaltyPoints, deltaPoints, segment, firstName, lastName, mobile, email } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Guest ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (loyaltyPoints !== undefined) updateData.loyaltyPoints = Math.max(0, Number(loyaltyPoints));
    if (deltaPoints !== undefined) {
      const currentGuest = await prisma.guest.findUnique({ where: { id }, select: { loyaltyPoints: true } });
      const current = currentGuest?.loyaltyPoints || 0;
      updateData.loyaltyPoints = Math.max(0, current + Number(deltaPoints));
    }
    if (segment !== undefined) updateData.segment = segment;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = email;

    const updated = await prisma.guest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated, message: 'Guest updated successfully!' });
  } catch (error: any) {
    return apiError(error);
  }
}
