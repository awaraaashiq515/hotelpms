import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, companyName, address, city, commissionRate, pinCode, isActive, isBlocked, blockedReason, notes, portalPassword } = body;

    const agent = await prisma.travelAgent.findUnique({
      where: { id },
    });
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (pinCode !== undefined) updateData.pinCode = String(pinCode);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (notes !== undefined) updateData.notes = notes;
    if (portalPassword !== undefined) {
      if (portalPassword === null || portalPassword === '') {
        updateData.passwordHash = null; // Remove portal access
      } else if (portalPassword.length >= 6) {
        updateData.passwordHash = await bcrypt.hash(portalPassword, 10);
      }
    }

    const updated = await prisma.travelAgent.update({ where: { id }, data: updateData });

    // Handle hotel-specific relation (commission rate & block status)
    if (commissionRate !== undefined || isBlocked !== undefined) {
      await prisma.agentHotelRelation.upsert({
        where: {
          agentId_propertyId: {
            agentId: id,
            propertyId: session.propertyId!,
          },
        },
        create: {
          agentId: id,
          propertyId: session.propertyId!,
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : agent.commissionRate,
          isBlocked: isBlocked !== undefined ? Boolean(isBlocked) : false,
          blockedReason: blockedReason || null,
        },
        update: {
          ...(commissionRate !== undefined && { commissionRate: Number(commissionRate) }),
          ...(isBlocked !== undefined && { isBlocked: Boolean(isBlocked) }),
          ...(blockedReason !== undefined && { blockedReason }),
        },
      });
    }

    return NextResponse.json({ success: true, data: updated, message: 'Agent updated successfully.' });
  } catch (error: any) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const agent = await prisma.travelAgent.findFirst({
      where: { id, propertyId: session.propertyId! },
      include: { bookings: { select: { id: true } } },
    });
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found.' }, { status: 404 });
    }
    if (agent.bookings.length > 0) {
      // Soft delete: just deactivate
      await prisma.travelAgent.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true, message: 'Agent deactivated (has existing bookings).' });
    }

    await prisma.travelAgent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Agent deleted successfully.' });
  } catch (error: any) {
    return apiError(error);
  }
}
