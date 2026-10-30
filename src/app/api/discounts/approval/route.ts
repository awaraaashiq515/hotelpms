import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * GET /api/discounts/approval
 * Fetch discount approvals and current property discount control rules.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSession();
    const id = searchParams.get('id');
    const propertyCode = searchParams.get('propertyCode');
    const propertyIdParam = searchParams.get('propertyId');
    const statusParam = searchParams.get('status') || 'PENDING';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    // 1. If fetching a specific approval by ID (for POS/Frontdesk polling)
    if (id) {
      const approval = await prisma.discountApproval.findUnique({
        where: { id },
      });
      if (!approval) {
        return apiError(new Error('Discount approval request not found'), 404);
      }
      return apiResponse(approval, 'Approval status fetched');
    }

    // 2. Strict Role Check: Only Hotel Admin / Managers can view the list of pending approvals
    const adminRoles = ['HOTEL_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'HOTEL_MANAGER', 'RESTAURANTS_ADMIN'];
    const userRole = (session as any)?.role || (session as any)?.roleName || '';
    if (!adminRoles.includes(userRole)) {
      return apiResponse({ approvals: [], settings: null }, 'Approvals list restricted to Hotel Admin');
    }

    // 2. Resolve property
    let property: any = null;
    if (propertyCode) {
      property = await prisma.property.findFirst({
        where: { code: propertyCode.toUpperCase() },
        include: { organization: { include: { properties: true } } },
      });
    } else if (propertyIdParam) {
      property = await prisma.property.findUnique({
        where: { id: propertyIdParam },
        include: { organization: { include: { properties: true } } },
      });
    } else if (session?.propertyId) {
      property = await prisma.property.findUnique({
        where: { id: session.propertyId },
        include: { organization: { include: { properties: true } } },
      });
    }

    // Collect all property IDs in the organization if property belongs to one
    let targetPropertyIds: string[] = [];
    if (property?.organization?.properties?.length) {
      targetPropertyIds = property.organization.properties.map((p: any) => p.id);
    } else if (property?.id) {
      targetPropertyIds = [property.id];
    }

    const whereClause: any = {};
    if (targetPropertyIds.length > 0) {
      whereClause.propertyId = { in: targetPropertyIds };
    }

    if (statusParam && statusParam.toUpperCase() !== 'ALL') {
      whereClause.status = statusParam.toUpperCase();
    }

    const approvals = await prisma.discountApproval.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const settings = {
      discountApprovalEnabled: property?.discountApprovalEnabled ?? true,
      maxStaffDiscountPercent: property?.maxStaffDiscountPercent ?? 10.0,
      maxStaffDiscountAmount: property?.maxStaffDiscountAmount ?? 200.0,
      hasPinConfigured: Boolean(property?.managerDiscountPin),
    };

    return apiResponse({ approvals, settings }, 'Discount approvals fetched successfully');
  } catch (error: any) {
    console.error('[Discount Approvals GET Error]:', error);
    return apiError(error, 500, 'Failed to fetch discount approvals');
  }
}

/**
 * POST /api/discounts/approval
 * Staff creates a new discount approval request.
 * Can also be instantly auto-approved if valid managerPin is passed.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const {
      propertyCode,
      propertyId: propIdInput,
      orderId,
      bookingId,
      source = 'RESTAURANT_POS',
      referenceTitle = 'Order',
      billAmount = 0,
      discountType = 'PERCENTAGE',
      discountValue = 0,
      discountAmount = 0,
      finalAmount = 0,
      reason = 'Special Customer Discount',
      requestedById: reqIdInput,
      requestedByName: reqNameInput,
      managerPin,
    } = body;

    // Resolve property
    let property: any = null;
    if (propertyCode) {
      property = await prisma.property.findFirst({
        where: { code: propertyCode.toUpperCase() },
      });
    } else if (propIdInput) {
      property = await prisma.property.findUnique({
        where: { id: propIdInput },
      });
    } else if (session?.propertyId) {
      property = await prisma.property.findUnique({
        where: { id: session.propertyId },
      });
    }

    if (!property) {
      return apiError(new Error('Property not found'), 404);
    }

    const propertyId = property.id;
    const requestedById = reqIdInput || session?.id || 'staff_unknown';
    const requestedByName = reqNameInput || (session as any)?.fullName || session?.email || 'Staff Member';

    // Check if manager PIN provided for instant counter approval
    let isInstantPinApproved = false;
    if (managerPin) {
      const configuredPin = property.managerDiscountPin || '1234';
      if (String(managerPin).trim() === String(configuredPin).trim()) {
        isInstantPinApproved = true;
      } else {
        return apiError(new Error('Invalid Manager PIN entered'), 401);
      }
    }

    const newApproval = await prisma.discountApproval.create({
      data: {
        propertyId,
        orderId: orderId || null,
        bookingId: bookingId || null,
        source,
        referenceTitle,
        billAmount: Number(billAmount) || 0,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: Number(discountValue) || 0,
        discountAmount: Number(discountAmount) || 0,
        finalAmount: Number(finalAmount) || 0,
        reason: reason?.trim() || 'Requested extra discount',
        requestedById,
        requestedByName,
        status: isInstantPinApproved ? 'APPROVED' : 'PENDING',
        approvalMethod: isInstantPinApproved ? 'MANAGER_PIN' : null,
        approvedById: isInstantPinApproved ? 'manager_pin' : null,
        approvedByName: isInstantPinApproved ? 'Manager (PIN Override)' : null,
      },
    });

    return apiResponse(
      newApproval,
      isInstantPinApproved
        ? 'Discount approved successfully via Manager PIN'
        : 'Approval request sent to Admin successfully',
      201
    );
  } catch (error: any) {
    console.error('[Discount Approvals POST Error]:', error);
    return apiError(error, 500, 'Failed to create discount approval request');
  }
}

/**
 * PATCH /api/discounts/approval
 * Admin or Manager approves or rejects a pending discount request.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { id, action, rejectionReason, managerPin } = body;

    if (!id) {
      return apiError(new Error('Approval request ID is required'), 400);
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return apiError(new Error('Action must be APPROVE or REJECT'), 400);
    }

    const existing = await prisma.discountApproval.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existing) {
      return apiError(new Error('Discount approval request not found'), 404);
    }

    let isPinUsed = false;
    if (managerPin) {
      const configuredPin = existing.property?.managerDiscountPin || '1234';
      if (String(managerPin).trim() === String(configuredPin).trim()) {
        isPinUsed = true;
      } else {
        return apiError(new Error('Invalid Manager PIN'), 401);
      }
    }

    // Role check: If not using a valid Manager PIN, the user MUST be a Hotel Admin or Manager
    if (!isPinUsed) {
      const adminRoles = ['HOTEL_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'HOTEL_MANAGER', 'RESTAURANTS_ADMIN'];
      const userRole = (session as any)?.role || (session as any)?.roleName || '';
      if (!adminRoles.includes(userRole)) {
        return apiError(new Error('Unauthorized: Only Hotel Admin or Manager can approve or reject discounts'), 403);
      }
    }

    const approverName = (session as any)?.fullName || session?.email || (isPinUsed ? 'Manager (PIN)' : 'Admin');
    const approverId = session?.id || (isPinUsed ? 'manager_pin' : 'admin');

    const updated = await prisma.discountApproval.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvedById: approverId,
        approvedByName: approverName,
        approvalMethod: isPinUsed ? 'MANAGER_PIN' : 'REMOTE_DASHBOARD',
        rejectionReason: action === 'REJECT' ? rejectionReason || 'Discount rejected by admin' : null,
        updatedAt: new Date(),
      },
    });

    return apiResponse(
      updated,
      action === 'APPROVE' ? 'Discount request approved' : 'Discount request rejected'
    );
  } catch (error: any) {
    console.error('[Discount Approvals PATCH Error]:', error);
    return apiError(error, 500, 'Failed to update discount approval status');
  }
}
