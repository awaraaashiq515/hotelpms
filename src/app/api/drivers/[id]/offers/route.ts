import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiResponse, apiError, getMultiTenantWhere } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error("Unauthorized"), 401);

    const driver = await prisma.driver.findUnique({
      where: { 
        id,
        ...getMultiTenantWhere(session) 
      },
      include: {
        offerProgresses: {
          include: { offer: true },
          orderBy: { startedAt: 'desc' },
        },
        offerHistories: {
          include: { offer: true },
          orderBy: { completedAt: 'desc' },
        },
        rewardPayouts: {
          include: { offer: true },
          orderBy: { createdAt: 'desc' },
        },
        offerAuditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!driver) return apiError(new Error("Driver not found"), 404);

    return apiResponse(driver);
  } catch (error) {
    return apiError(error);
  }
}
