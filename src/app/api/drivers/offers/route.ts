import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiResponse, apiError, getMultiTenantWhere } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error("Unauthorized"), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const offers = await prisma.offer.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      orderBy: { createdAt: 'desc' },
      include: {
        nextOffer: true,
      }
    });

    return apiResponse(offers);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error("Unauthorized"), 401);

    const body = await request.json();
    const { 
      title, offerType, targetRides, targetReferrals, 
      rewardType, rewardValue, rewardItem, resetType, nextOfferId, 
      isActive, startDate, endDate, priority, propertyId: bodyPropertyId
    } = body;

    const propertyId = session.propertyId || bodyPropertyId;
    if (!propertyId) return apiError(new Error("Property ID is required"), 400);

    const newOffer = await prisma.offer.create({
      data: {
        propertyId,
        title,
        offerType: offerType || 'RIDES',
        targetRides: targetRides || 0,
        targetReferrals: targetReferrals || 0,
        rewardType: rewardType || 'CASH',
        rewardValue: rewardValue || 0,
        rewardItem: rewardItem || null,
        resetType: resetType || 'SAME_OFFER',
        nextOfferId: nextOfferId || null,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || 0,
      }
    });

    return apiResponse(newOffer, "Offer created successfully", 201);
  } catch (error) {
    return apiError(error);
  }
}
