import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiResponse, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    try {
        // Get session
        const session = await getSession();
        if (!session) return apiError(new Error("Unauthorized"), 401);

        const body = await request.json();
        const { driverId, offerId, propertyId: bodyPropertyId } = body;

        // Use session.propertyId or body propertyId
        const propertyId = (session as any).propertyId || bodyPropertyId;
        if (!propertyId) return apiError(new Error("Property ID is required"), 400);

        // Check if driver has any active offer
        const active = await prisma.driverOfferProgress.findFirst({
            where: { driverId, status: "ACTIVE" }
        });

        if (active) {
            // Pause current offer
            await prisma.driverOfferProgress.update({
                where: { id: active.id },
                data: { status: "PAUSED" }
            });
        }

        // Assign or reactivate new offer
        const progress = await prisma.driverOfferProgress.upsert({
            where: {
                driverId_offerId: { driverId, offerId }
            },
            create: {
                driverId,
                offerId,
                status: "ACTIVE",
                resetCount: 0
            },
            update: {
                status: "ACTIVE"
            }
        });

        // Use session.userId if exists, otherwise fallback
        const createdBy = (session as any).userId || "RESTAURANTS_ADMIN";

        // Create audit log
        await prisma.offerAuditLog.create({
            data: {
                driverId,
                actionType: "OFFER_MANUAL_ASSIGN",
                note: `Admin manually assigned offer ${offerId}`,
                createdBy
            }
        });

        return apiResponse(progress, "Offer successfully assigned to driver", 201);
    } catch (error) {
        return apiError(error);
    }
}