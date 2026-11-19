import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError } from '@/lib/api-utils';
import { createNotification } from '@/lib/notificationService';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await req.json();
    const { planName, phone, notes } = body;

    if (!planName) {
      return NextResponse.json({ success: false, error: 'Plan name is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id || (session as any).userId },
      include: { organization: true, property: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Find requested package
    const targetPackage = await prisma.package.findFirst({
      where: { name: { equals: planName } }
    });

    if (user.organizationId && targetPackage) {
      // Mark pending package on organization
      await prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          pendingPackageId: targetPackage.id,
          subscriptionStatus: 'PENDING_APPROVAL'
        }
      });
    }

    // Create system notification for Super Admin / Admin
    if (user.propertyId) {
      try {
        await createNotification({
          propertyId: user.propertyId,
          title: `⭐ Plan Upgrade Request: ${planName}`,
          message: `${user.organization?.name || 'Hotel'} requested upgrade to ${planName} plan. Contact: ${phone || user.email}. Notes: ${notes || 'Requested from My Subscription page'}`,
          type: 'SYSTEM',
          priority: 'HIGH',
          metadata: {
            organizationId: user.organizationId,
            planName,
            phone: phone || user.email,
            requestedAt: new Date().toISOString()
          }
        });
      } catch (notifErr) {
        console.error('[Subscription Request] Failed to create notification:', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upgrade request for ${planName} plan has been submitted successfully to Super Admin!`,
      data: {
        planName,
        status: 'PENDING_APPROVAL'
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
