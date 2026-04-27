import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const guestId = searchParams.get('guestId');
    const cardNumber = searchParams.get('cardNumber');

    const where: any = getMultiTenantWhere(session, propertyIdParam);
    
    // For cards, we need to filter by membershipPlan -> propertyId
    // getMultiTenantWhere returns { propertyId: ... } or { property: { organizationId: ... } }
    // We need to adapt it for MembershipCard which doesn't have propertyId directly (it's through MembershipPlan)
    
    const baseWhere = getMultiTenantWhere(session, propertyIdParam);
    const adaptedWhere: any = {
        membershipPlan: baseWhere.propertyId ? { propertyId: baseWhere.propertyId } : baseWhere.property ? { property: baseWhere.property } : {}
    };

    if (guestId) adaptedWhere.guestId = guestId;
    if (cardNumber) adaptedWhere.cardNumber = cardNumber;

    const cards = await prisma.membershipCard.findMany({
      where: adaptedWhere,
      include: {
        membershipPlan: true,
        guest: {
            select: { firstName: true, lastName: true, mobile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(cards);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    
    const body = await request.json();
    const { membershipPlanId, guestId, cardNumber } = body;

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId }
    });

    if (!plan) return apiError(new Error('Membership Plan not found'), 404);

    // If cardNumber not provided, generate a unique one
    const finalCardNumber = cardNumber || `MEM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const card = await prisma.membershipCard.create({
      data: {
        cardNumber: finalCardNumber,
        membershipPlanId,
        guestId: guestId || null,
        expiresAt: addDays(new Date(), plan.validityDays),
        status: 'ACTIVE',
      },
    });

    return apiResponse(card, 'Membership Card issued', 201);
  } catch (error) {
    return apiError(error);
  }
}
