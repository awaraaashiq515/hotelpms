import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { cardNumber, mobile } = body;

    if (!cardNumber && !mobile) {
      return apiError(new Error('Card number or Mobile is required'), 400);
    }

    let card = null;

    if (cardNumber) {
      card = await prisma.membershipCard.findUnique({
        where: { cardNumber },
        include: {
          membershipPlan: true,
          guest: { select: { firstName: true, lastName: true, mobile: true } }
        }
      });
    } else if (mobile) {
      // Find guest by mobile, then their active card
      const guest = await prisma.guest.findFirst({
        where: { 
            mobile,
            organizationId: session.organizationId || undefined
        }
      });

      if (guest) {
        card = await prisma.membershipCard.findFirst({
          where: { 
              guestId: guest.id,
              status: 'ACTIVE',
              expiresAt: { gt: new Date() }
          },
          include: {
            membershipPlan: true,
            guest: { select: { firstName: true, lastName: true, mobile: true } }
          }
        });
      }
    }

    if (!card) {
      return apiError(new Error('Valid Membership Card not found'), 404);
    }

    // Check status and expiry again for cardNumber search
    if (card.status !== 'ACTIVE') {
        return apiError(new Error(`Card is currently ${card.status}`), 400);
    }
    if (new Date(card.expiresAt) < new Date()) {
        return apiError(new Error('Card has expired'), 400);
    }

    return apiResponse(card, 'Card validated');
  } catch (error) {
    return apiError(error);
  }
}
