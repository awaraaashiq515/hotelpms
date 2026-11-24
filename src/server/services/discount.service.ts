/**
 * src/server/services/discount.service.ts
 * WP-0.6: Discount approval workflow and manager PIN verification.
 */

import { prisma } from '@/lib/prisma';

export interface DiscountApprovalParams {
  propertyId: string;
  type?: 'DISCOUNT' | 'COMPLIMENTARY' | 'VOID' | 'PRICE_OVERRIDE';
  requestedBy: string;
  refModule: 'FOLIO' | 'POS' | 'ROOM';
  refId?: string;
  discountPct?: number;
  discountAmt?: number;
  reason: string;
  managerPin?: string;
}

export async function requestOrApproveDiscount({
  propertyId,
  type = 'DISCOUNT',
  requestedBy,
  refModule,
  refId,
  discountPct = 0,
  discountAmt = 0,
  reason,
  managerPin,
}: DiscountApprovalParams) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      discountApprovalEnabled: true,
      maxStaffDiscountPercent: true,
      maxStaffDiscountAmount: true,
      managerDiscountPin: true,
    },
  });

  const maxPct = property?.maxStaffDiscountPercent ?? 10;
  const maxAmt = property?.maxStaffDiscountAmount ?? 200;
  const isOverLimit = (discountPct > maxPct) || (discountAmt > maxAmt);

  // If manager provided instant PIN and it matches, approve immediately
  const pinValid = Boolean(managerPin && property?.managerDiscountPin && managerPin === property.managerDiscountPin);

  if (!isOverLimit || pinValid) {
    // Approved directly
    return await prisma.approvalRequest.create({
      data: {
        propertyId,
        type,
        status: 'APPROVED',
        requestedBy,
        approvedBy: pinValid ? 'MANAGER_PIN' : requestedBy,
        refModule,
        refId,
        discountPct,
        discountAmt,
        reason,
        pinVerified: pinValid,
        actionedAt: new Date(),
      },
    });
  }

  // Otherwise, create PENDING approval request for Admin / Owner
  return await prisma.approvalRequest.create({
    data: {
      propertyId,
      type,
      status: 'PENDING',
      requestedBy,
      refModule,
      refId,
      discountPct,
      discountAmt,
      reason,
      pinVerified: false,
    },
  });
}

export async function actionApprovalRequest(requestId: string, action: 'APPROVE' | 'REJECT', actionedBy: string) {
  return await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      ...(action === 'APPROVE' ? { approvedBy: actionedBy } : { rejectedBy: actionedBy }),
      actionedAt: new Date(),
    },
  });
}
