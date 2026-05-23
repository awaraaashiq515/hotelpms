import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { organizationId, action } = body;

    if (!organizationId || !action) {
      return NextResponse.json({ success: false, error: 'Missing organizationId or action' }, { status: 400 });
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ success: false, error: 'Invalid action, must be APPROVE or REJECT' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const pendingPackageId = org.pendingPackageId;
      if (!pendingPackageId) {
        return NextResponse.json({ success: false, error: 'No pending package selected for this organization' }, { status: 400 });
      }

      // Activate package for 1 year
      const now = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);

      const updatedOrg = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          packageId: pendingPackageId,
          packageStartDate: now,
          packageEndDate: oneYearFromNow,
          subscriptionStatus: 'ACTIVE',
          pendingPackageId: null, // Clear pending
        }
      });

      return NextResponse.json({ success: true, message: 'Subscription approved and activated', data: updatedOrg });
    } else {
      // REJECT - return to PENDING_PAYMENT
      const updatedOrg = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionStatus: 'PENDING_PAYMENT',
          paymentReference: null, // Clear bad reference
          paymentAmount: null,
          paymentDate: null,
        }
      });

      return NextResponse.json({ success: true, message: 'Subscription payment reference rejected', data: updatedOrg });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
