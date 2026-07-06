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
    const where = getMultiTenantWhere(session, propertyIdParam);

    // Get all drivers with their active and completed offers
    const drivers = await (prisma as any).driver.findMany({
      where,
      include: {
        offerProgresses: {
          where: { status: 'ACTIVE' },
          include: { offer: true },
        },
        offerHistories: true,
        rewardPayouts: {
          where: { payoutStatus: 'PENDING' },
        },
      },
      orderBy: { createdAt: "desc" }
    });

    const progressData = (drivers as any[]).map(driver => {
      const activeProgress = driver.offerProgresses[0] || null;
      const completedOffersCount = driver.offerHistories.length;
      const pendingRewardsCount = driver.rewardPayouts?.length || 0;

      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        status: driver.isActive ? 'Active' : 'Inactive',
        activeOffer: activeProgress ? activeProgress.offer.title : 'No Level Assigned',
        offerLevel: activeProgress ? `Level ${activeProgress.resetCount + 1}` : 'N/A',
        completedRides: activeProgress ? activeProgress.completedRides : 0,
        referredCustomers: activeProgress ? activeProgress.completedReferrals : 0,
        targetRides: activeProgress ? activeProgress.offer.targetRides : 0,
        targetReferrals: activeProgress ? activeProgress.offer.targetReferrals : 0,
        progressPercent: activeProgress ? activeProgress.progressPercent : 0,
        completedOffersCount,
        pendingRewardsCount,
        rewardPending: pendingRewardsCount > 0,
      };
    });

    return apiResponse(progressData);
  } catch (error) {
    return apiError(error);
  }
}
