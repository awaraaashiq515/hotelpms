import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const tickets = await prisma.maintenanceTicket.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      },
      orderBy: { openedAt: 'desc' },
    });

    return apiResponse(tickets);
  } catch (error) {
    return apiError(error);
  }
}

import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staff: any = null;
    if (!session) {
      staff = await getWTUserFromRequest(request as any);
    }
    if (!session && !staff) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const propertyId = body.propertyId || (session ? await resolveAdminProperty(session, prisma) : staff.propertyId);

    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    const { roomId, issueType, priority, description } = body;

    if (!roomId || !issueType || !priority) {
      return apiError(new Error('Room ID, Issue Type, and Priority are required.'), 400);
    }

    const ticketNo = `MNT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    let raisedByName = 'System';
    if (session) {
      const userObj = await prisma.user.findUnique({
        where: { id: session.id },
        select: { fullName: true }
      });
      raisedByName = userObj?.fullName || session.email || 'System';
    } else if (staff) {
      raisedByName = staff.fullName || 'Housekeeper';
    }

    const ticket = await prisma.$transaction(async (tx: any) => {
      // 1. Create the maintenance ticket
      const newTicket = await tx.maintenanceTicket.create({
        data: {
          propertyId,
          roomId,
          ticketNo,
          issueType,
          priority,
          description: description || '',
          status: 'OPEN',
          raisedBy: raisedByName,
        },
        include: {
          room: true
        }
      });

      // 2. Automatically set Room status to MAINTENANCE
      await tx.room.update({
        where: { id: roomId },
        data: {
          status: 'MAINTENANCE'
        }
      });

      return newTicket;
    });

    return apiResponse(ticket, 'Maintenance ticket raised and room blocked successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return apiError(new Error('Ticket ID and Status are required.'), 400);
    }

    const currentTicket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId }
    });

    if (!currentTicket) {
      return apiError(new Error('Maintenance ticket not found.'), 404);
    }

    const updatedTicket = await prisma.$transaction(async (tx: any) => {
      // 1. Update the ticket
      const ticket = await tx.maintenanceTicket.update({
        where: { id: ticketId },
        data: {
          status,
          resolvedAt: status === 'RESOLVED' ? new Date() : undefined
        }
      });

      // 2. If resolved, put room back into service (AVAILABLE / Needs Cleaning)
      if (status === 'RESOLVED' && currentTicket.roomId) {
        await tx.room.update({
          where: { id: currentTicket.roomId },
          data: {
            status: 'AVAILABLE',
            housekeepingStatus: 'DIRTY' // needs review/cleaning after repairs
          }
        });
      }

      return ticket;
    });

    return apiResponse(updatedTicket, 'Maintenance ticket updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
