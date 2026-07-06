import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiResponse, apiError, getMultiTenantWhere } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error("Unauthorized"), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const driverId = searchParams.get("driverId");
    const offerId = searchParams.get("offerId");

    const where = getMultiTenantWhere(session, propertyIdParam);

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const histories = await (prisma as any).driverOfferHistory.findMany({
      where: {
        driver: { propertyId: where.propertyId },
        ...(driverId ? { driverId } : {}),
        ...(offerId ? { offerId } : {}),
        ...(Object.keys(dateFilter).length > 0 ? { completedAt: dateFilter } : {}),
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        },
        offer: {
          select: { id: true, title: true, priority: true, rewardType: true, rewardValue: true, rewardItem: true }
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Aggregate summary stats
    const totalRewardsPaid = histories.reduce((sum: number, h: any) => sum + (h.rewardEarned || 0), 0);
    const uniqueDriversRewarded = new Set(histories.map((h: any) => h.driverId)).size;

    // Top performer (most reward earnings)
    const driverTotals: Record<string, { name: string; total: number }> = {};
    for (const h of histories as any[]) {
      if (!driverTotals[h.driverId]) {
        driverTotals[h.driverId] = { name: h.driver.name, total: 0 };
      }
      driverTotals[h.driverId].total += h.rewardEarned || 0;
    }
    const topPerformer = Object.values(driverTotals).sort((a, b) => b.total - a.total)[0] || null;

    return apiResponse({
      histories,
      summary: {
        totalRewardsPaid,
        uniqueDriversRewarded,
        totalEntries: histories.length,
        topPerformer,
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
