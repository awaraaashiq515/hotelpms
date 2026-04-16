import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiResponse, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return apiError(new Error("Unauthorized"), 401);

        const body = await request.json();
        const { driverId, action, offerId, propertyId: bodyPropertyId } = body;

        const propertyId = (session as any).propertyId || bodyPropertyId;
        if (!propertyId) return apiError(new Error("Property ID is required"), 400);

        const activeProgress = await (prisma as any).driverOfferProgress.findFirst({
            where: { driverId, status: "ACTIVE" },
            include: { offer: true }
        });

        if (!activeProgress) return apiError(new Error("No active progress found for this driver"), 404);

        if (action === 'RESET') {
            await (prisma as any).driverOfferProgress.update({
                where: { id: activeProgress.id },
                data: {
                    completedRides: 0,
                    completedReferrals: 0,
                    progressPercent: 0,
                    updatedAt: new Date()
                }
            });

            await prisma.offerAuditLog.create({
                data: {
                    driverId,
                    actionType: "OFFER_MANUAL_RESET",
                    note: `Admin manually reset progress to zero for offer ${activeProgress.offer.title}`,
                    createdBy: (session as any).userId || "ADMIN"
                }
            });

            return apiResponse(null, "Progress reset to zero successfully");
        }

        if (action === 'REDEEM_AND_RESET') {
            // 1. Record to History even if not finished
            await (prisma as any).driverOfferHistory.create({
                data: {
                    driverId,
                    offerId: activeProgress.offerId,
                    ridesAtCompletion: activeProgress.completedRides,
                    referralsAtCompletion: activeProgress.completedReferrals,
                    rewardEarned: activeProgress.offer.rewardValue,
                    rewardItemEarned: activeProgress.offer.rewardItem,
                    completedAt: new Date()
                }
            });

            // 2. Reset progress
            await (prisma as any).driverOfferProgress.update({
                where: { id: activeProgress.id },
                data: {
                    completedRides: 0,
                    completedReferrals: 0,
                    progressPercent: 0,
                    resetCount: { increment: 1 },
                    updatedAt: new Date()
                }
            });

            await prisma.offerAuditLog.create({
                data: {
                    driverId,
                    actionType: "OFFER_MANUAL_REDEEM",
                    note: `Admin manually redeemed reward and reset progress for offer ${activeProgress.offer.title}`,
                    createdBy: (session as any).userId || "ADMIN"
                }
            });

            return apiResponse(null, "Reward redeemed and progress restarted successfully");
        }

        return apiError(new Error("Invalid action type"), 400);

    } catch (error) {
        return apiError(error);
    }
}
