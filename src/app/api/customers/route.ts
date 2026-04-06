import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { processDriverReferral } from '@/lib/driverOfferEngine';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const customers = await prisma.guest.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(customers);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { firstName, lastName, email, mobile, address, gender, driverId } = body;

    const customer = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email,
        mobile,
        address,
        gender,
        organizationId: session.organizationId,
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
