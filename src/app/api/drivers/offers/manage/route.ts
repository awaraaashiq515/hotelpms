import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiResponse, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return apiError(new Error("Unauthorized"), 401);

        const body = await request.json();
        const { driverId, action, propertyId: bodyPropertyId } = body;

        const propertyId = (session as any).propertyId || bodyPropertyId;
        if (!propertyId) return apiError(new Error("Property ID is required"), 400);

        // ── MARK_GIVEN: mark all pending reward payouts as PAID ──────────────
        if (action === 'MARK_GIVEN') {
            const pending = await (prisma as any).rewardPayout.findMany({
                where: { driverId, payoutStatus: 'PENDING' }
            });

            if (pending.length === 0) {
                return apiError(new Error("No pending rewards found for this driver"), 404);
            }

            await (prisma as any).rewardPayout.updateMany({
                where: { driverId, payoutStatus: 'PENDING' },
                data: { payoutStatus: 'PAID', paidAt: new Date() }
            });

            await prisma.offerAuditLog.create({
                data: {
                    driverId,
                    actionType: "REWARD_MARKED_GIVEN",
                    note: `Admin confirmed ${pending.length} reward(s) given to driver`,
                    createdBy: (session as any).userId || "ADMIN"
                }
            });

            return apiResponse(null, `${pending.length} reward(s) marked as given`);
        }

        // ── RESET: manually reset current progress to zero ───────────────────
        if (action === 'RESET') {
            const activeProgress = await (prisma as any).driverOfferProgress.findFirst({
                where: { driverId, status: 'ACTIVE' },
                include: { offer: true }
            });

            if (!activeProgress) return apiError(new Error("No active progress found for this driver"), 404);

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

        return apiError(new Error("Invalid action type"), 400);

    } catch (error) {
        return apiError(error);
    }
}
