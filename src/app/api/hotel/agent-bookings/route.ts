import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const agentId = searchParams.get('agentId') || '';
    const propertyIdParam = searchParams.get('propertyId') || '';

    const where: any = {};
    if (propertyIdParam && propertyIdParam !== 'all' && propertyIdParam !== 'null') {
      where.propertyId = propertyIdParam;
    } else if (session?.propertyId) {
      // If user is logged into a restaurant branch, find the hotel property in the same org
      const prop = await prisma.property.findUnique({
        where: { id: session.propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true }
        });
        if (hotelProp) {
          where.propertyId = hotelProp.id;
        }
      } else {
        where.propertyId = session.propertyId;
      }
    }
    if (status && status !== 'ALL') where.status = status;
    if (agentId) where.agentId = agentId;

    let bookings = await prisma.agentBooking.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, agentCode: true, phone: true, commissionRate: true, companyName: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If filtered by propertyId returned 0, fallback to finding all bookings matching status/agent
    // so dashboard never shows blank if bookings were assigned to another property or portal default
    if (bookings.length === 0 && where.propertyId) {
      const fallbackWhere: any = {};
      if (status && status !== 'ALL') fallbackWhere.status = status;
      if (agentId) fallbackWhere.agentId = agentId;
      const allBookings = await prisma.agentBooking.findMany({
        where: fallbackWhere,
        include: {
          agent: { select: { id: true, name: true, agentCode: true, phone: true, commissionRate: true, companyName: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (allBookings.length > 0) {
        bookings = allBookings;
      }
    }

    // Attach assigned room info from linked Reservation (if allotted) and notes
    const reservationIds = bookings.map((b) => b.reservationId).filter(Boolean) as string[];
    const reservationsById: Record<string, any> = {};
    const roomsById: Record<string, any> = {};

    // Collect room IDs from notes as well
    const notesRoomIdsByBookingId: Record<string, string[]> = {};
    const allCollectedRoomIds = new Set<string>();

    for (const b of bookings) {
      if (b.notes) {
        const m = b.notes.match(/\[ALLOTTED_ROOM_IDS:\s*([^\]]+)\]/i);
        if (m) {
          const ids = m[1].split(',').map((x: string) => x.trim()).filter(Boolean);
          notesRoomIdsByBookingId[b.id] = ids;
          ids.forEach((id: string) => allCollectedRoomIds.add(id));
        }
      }
    }

    if (reservationIds.length > 0) {
      const linkedReservations = await prisma.reservation.findMany({
        where: { id: { in: reservationIds } },
        select: {
          id: true,
          bookingNo: true,
          assignedRoomId: true,
          rooms: {
            select: {
              roomId: true,
            },
          },
        },
      });

      for (const r of linkedReservations) {
        if (r.assignedRoomId) allCollectedRoomIds.add(r.assignedRoomId);
        if (r.rooms) {
          for (const rm of r.rooms) {
            if (rm.roomId) allCollectedRoomIds.add(rm.roomId);
          }
        }
        reservationsById[r.id] = r;
      }
    }

    if (allCollectedRoomIds.size > 0) {
      const fetchedRooms = await prisma.room.findMany({
        where: { id: { in: Array.from(allCollectedRoomIds) } },
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          status: true,
          roomType: { select: { id: true, name: true } },
        },
      });
      for (const rm of fetchedRooms) {
        roomsById[rm.id] = rm;
      }
    }

    const enrichedBookings = bookings.map((b) => {
      const res = b.reservationId ? reservationsById[b.reservationId] : null;
      const resRoomIds: string[] = res?.rooms?.map((rm: any) => rm.roomId).filter(Boolean) || [];
      const primaryResRoomId: string[] = res?.assignedRoomId ? [res.assignedRoomId] : [];
      const noteRoomIds: string[] = notesRoomIdsByBookingId[b.id] || [];

      // Combine unique room IDs maintaining order
      const combinedIds = Array.from(new Set([...noteRoomIds, ...resRoomIds, ...primaryResRoomId])).filter(Boolean);
      const assignedRooms = combinedIds.map((id) => roomsById[id]).filter(Boolean);
      const primaryRoom = assignedRooms[0] || (res?.assignedRoomId ? roomsById[res.assignedRoomId] : null);

      return {
        ...b,
        assignedRoomId: primaryRoom?.id || null,
        assignedRoom: primaryRoom || null,
        assignedRoomIds: assignedRooms.map((r) => r.id),
        assignedRooms,
        bookingNo: res?.bookingNo || null,
      };
    });

    return NextResponse.json({ success: true, data: enrichedBookings });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agentId,
      propertyId,
      guestName,
      guestPhone,
      guestEmail,
      guestNationality = 'Indian',
      adults = 1,
      children = 0,
      checkIn,
      checkOut,
      roomType = 'Standard',
      totalAmount = 0,
      notes,
      specialRequests,
      includePoolAccess = false,
      includeSpaPackage = false,
      poolPassCount = 0,
      spaServiceType = null,
    } = body;

    if (!agentId || !guestName || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, message: 'agentId, guestName, checkIn, and checkOut are required.' },
        { status: 400 }
      );
    }

    // C11: Date validation
    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);
    if (isNaN(ciDate.getTime()) || isNaN(coDate.getTime())) {
      return NextResponse.json({ success: false, message: 'Valid checkIn and checkOut dates are required.' }, { status: 400 });
    }
    if (coDate <= ciDate) {
      return NextResponse.json({ success: false, message: 'Check-out date must be strictly after check-in date.' }, { status: 400 });
    }

    const agent = await prisma.travelAgent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found.' }, { status: 404 });
    }

    let targetPropertyId = propertyId || agent.propertyId;
    if (!targetPropertyId) {
      const defaultHotel = await prisma.property.findFirst({
        where: { OR: [{ type: 'HOTEL' }, { hmsEnabled: true }] }
      });
      targetPropertyId = defaultHotel?.id;
    }
    if (!targetPropertyId) {
      return NextResponse.json({ success: false, message: 'propertyId is required.' }, { status: 400 });
    }

    // C11: Live inventory check per room type
    const totalInventory = await prisma.room.count({
      where: {
        propertyId: targetPropertyId,
        ...(roomType ? { roomType: { name: { contains: roomType } } } : {}),
        status: { notIn: ['OUT_OF_ORDER', 'MAINTENANCE'] }
      }
    });
    if (totalInventory > 0) {
      const activeOverlap = await prisma.reservation.count({
        where: {
          propertyId: targetPropertyId,
          status: { notIn: ['CANCELLED', 'CHECKED_OUT'] },
          AND: [
            { arrivalDate: { lt: coDate } },
            { departureDate: { gt: ciDate } }
          ]
        }
      });
      if (activeOverlap >= totalInventory) {
        return NextResponse.json({
          success: false,
          message: `Inventory error: Hotel has only ${totalInventory} rooms for ${roomType}, and ${activeOverlap} are already booked for these dates.`
        }, { status: 400 });
      }
    }

    // Check hotel-specific relation (block status & custom commission rate)
    const relation = await prisma.agentHotelRelation.findUnique({
      where: {
        agentId_propertyId: {
          agentId,
          propertyId: targetPropertyId,
        },
      },
    });

    if (relation?.isBlocked) {
      return NextResponse.json(
        { success: false, message: 'You are blocked from submitting bookings for this property.' },
        { status: 403 }
      );
    }

    const effectiveCommissionRate = relation ? relation.commissionRate : agent.commissionRate;
    const commission = (Number(totalAmount) * effectiveCommissionRate) / 100;

    const booking = await prisma.agentBooking.create({
      data: {
        propertyId: targetPropertyId,
        agentId,
        guestName,
        guestPhone: guestPhone || null,
        guestEmail: guestEmail || null,
        guestNationality,
        adults: Number(adults),
        children: Number(children),
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        roomType,
        totalAmount: Number(totalAmount),
        commission,
        notes: notes || null,
        specialRequests: specialRequests || null,
        includePoolAccess: Boolean(includePoolAccess),
        includeSpaPackage: Boolean(includeSpaPackage),
        poolPassCount: Number(poolPassCount) || 0,
        spaServiceType: spaServiceType || null,
      },
      include: { agent: true },
    });

    // Create Hotel In-App Notification
    await prisma.notification.create({
      data: {
        propertyId: targetPropertyId,
        title: `🔔 New Agent Booking: ${guestName}`,
        message: `${roomType} booked by ${agent.name} (${agent.agentCode}). Total: ₹${Number(totalAmount).toLocaleString()}`,
        type: 'AGENT_BOOKING',
        status: 'UNREAD',
        priority: 'HIGH',
        metadata: JSON.stringify({
          bookingId: booking.id,
          agentId,
          agentName: agent.name,
          agentCode: agent.agentCode,
          agentPhone: agent.phone,
          guestName,
          guestPhone: guestPhone || null,
          roomType,
          totalAmount: Number(totalAmount),
          commission,
          checkIn,
          checkOut,
          adults: Number(adults),
          children: Number(children),
          link: '/hotel/agent-bookings',
        }),
      },
    }).catch((err) => {
      console.error('[AgentBooking] Failed to create notification:', err);
    });

    return NextResponse.json({
      success: true,
      data: booking,
      message: `Booking submitted! Commission: ₹${commission.toFixed(2)} @ ${effectiveCommissionRate}%`,
    });
  } catch (error: any) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    const body = await request.json();
    const {
      id,
      status,
      commissionPaid,
      totalAmount,
      notes,
      guestName,
      guestPhone,
      guestEmail,
      guestNationality,
      adults,
      children,
      checkIn,
      checkOut,
      roomType,
      specialRequests,
      includePoolAccess,
      includeSpaPackage,
      poolPassCount,
      spaServiceType,
      isAgentEdit,
      requireApproval,
      assignedRoomId,
      assignedRoomIds: inputRoomIds,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Booking ID is required.' }, { status: 400 });
    }

    const booking = await prisma.agentBooking.findUnique({
      where: { id },
      include: { agent: true },
    });
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (guestName !== undefined) updateData.guestName = guestName;
    if (guestPhone !== undefined) updateData.guestPhone = guestPhone || null;
    if (guestEmail !== undefined) updateData.guestEmail = guestEmail || null;
    if (guestNationality !== undefined) updateData.guestNationality = guestNationality;
    if (adults !== undefined) updateData.adults = Number(adults);
    if (children !== undefined) updateData.children = Number(children);
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn);
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut);
    if (roomType !== undefined) updateData.roomType = roomType;
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests || null;
    if (includePoolAccess !== undefined) updateData.includePoolAccess = Boolean(includePoolAccess);
    if (includeSpaPackage !== undefined) updateData.includeSpaPackage = Boolean(includeSpaPackage);
    if (poolPassCount !== undefined) updateData.poolPassCount = Number(poolPassCount) || 0;
    if (spaServiceType !== undefined) updateData.spaServiceType = spaServiceType || null;
    if (notes !== undefined) updateData.notes = notes;
    if (commissionPaid !== undefined) updateData.commissionPaid = Boolean(commissionPaid);

    // If agent edited the booking or requireApproval flag is on, always revert to PENDING
    const isEditResubmission = Boolean(isAgentEdit || requireApproval);
    if (isEditResubmission) {
      updateData.status = 'PENDING';
    } else if (status !== undefined) {
      updateData.status = status;
    }

    // Recalculate commission if totalAmount changes
    if (totalAmount !== undefined) {
      const parsedTotal = Number(totalAmount) || 0;
      updateData.totalAmount = parsedTotal;
      updateData.commission = (parsedTotal * (booking.agent.commissionRate || 10)) / 100;
    }

    // Handle Room Allotment (assignedRoomId or assignedRoomIds) from hotel front desk
    const rawRoomIds = inputRoomIds ?? (assignedRoomId ? [assignedRoomId] : undefined);
    const finalRoomIds: string[] = Array.isArray(rawRoomIds)
      ? rawRoomIds.filter(Boolean)
      : rawRoomIds ? [rawRoomIds] : [];

    if (finalRoomIds.length > 0) {
      // Calculate how many rooms were requested by agent
      let requestedCount = 1;
      const effectiveRoomType = (updateData.roomType || booking.roomType || '');
      const mParen = effectiveRoomType.match(/\((\d+)\s*Rooms?\)/i);
      if (mParen) {
        requestedCount = Math.max(1, parseInt(mParen[1], 10));
      } else {
        const mX = effectiveRoomType.match(/^(\d+)x\s+/i);
        if (mX) {
          requestedCount = Math.max(1, parseInt(mX[1], 10));
        } else {
          const notesText = (booking.notes || '') + ' ' + (updateData.notes || '');
          const mNotes = notesText.match(/\[ROOMS:\s*(\d+)x/i) || notesText.match(/(\d+)\s*Rooms?/i);
          if (mNotes) requestedCount = Math.max(1, parseInt(mNotes[1], 10));
        }
      }

      if (finalRoomIds.length > requestedCount) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot allot ${finalRoomIds.length} rooms. Agent requested only ${requestedCount} room(s).`,
          },
          { status: 400 }
        );
      }

      const targetRooms = await prisma.room.findMany({
        where: { id: { in: finalRoomIds } },
        include: {
          roomType: true,
          property: { select: { organizationId: true } },
        },
      });
      if (targetRooms.length === 0) {
        return NextResponse.json({ success: false, message: 'Selected rooms not found.' }, { status: 404 });
      }

      // Check overlapping reservations for any of these rooms
      const conflictRes = await prisma.reservation.findFirst({
        where: {
          propertyId: booking.propertyId,
          id: booking.reservationId ? { not: booking.reservationId } : undefined,
          status: { notIn: ['CANCELLED', 'CHECKED_OUT'] },
          OR: [
            { assignedRoomId: { in: finalRoomIds } },
            { rooms: { some: { roomId: { in: finalRoomIds } } } },
          ],
          AND: [
            { arrivalDate: { lt: booking.checkOut } },
            { departureDate: { gt: booking.checkIn } },
          ],
        },
        select: { id: true, bookingNo: true },
      });
      if (conflictRes) {
        return NextResponse.json(
          { success: false, message: `One or more selected rooms are already reserved (${conflictRes.bookingNo}) for these dates.` },
          { status: 400 }
        );
      }

      const primaryRoom = targetRooms[0];
      const finalResStatus =
        (updateData.status || booking.status) === 'CHECKED_IN'
          ? 'CHECKED_IN'
          : (updateData.status || booking.status) === 'COMPLETED'
          ? 'CHECKED_OUT'
          : 'CONFIRMED';

      const nightsCount = Math.max(
        1,
        Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)
      );
      const ratePerRoom = ((updateData.totalAmount ?? booking.totalAmount) / targetRooms.length) / nightsCount;

      if (booking.reservationId) {
        await prisma.reservation.update({
          where: { id: booking.reservationId },
          data: {
            assignedRoomId: primaryRoom.id,
            roomTypeId: primaryRoom.roomTypeId,
            status: finalResStatus,
          },
        });
        await prisma.reservationRoom.deleteMany({
          where: { reservationId: booking.reservationId },
        });
        await prisma.reservationRoom.createMany({
          data: targetRooms.map((rm) => ({
            reservationId: booking.reservationId!,
            roomId: rm.id,
            ratePerNight: ratePerRoom,
            adults: Math.max(1, Math.floor(booking.adults / targetRooms.length)),
            children: Math.floor(booking.children / targetRooms.length),
          })),
        });
      } else {
        // Find or create Guest record
        const nameParts = (booking.guestName || 'Guest').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || '-';
        const orgId = primaryRoom.property?.organizationId || session?.organizationId;

        let guest = booking.guestPhone && orgId
          ? await prisma.guest.findFirst({
              where: { organizationId: orgId, mobile: booking.guestPhone },
            })
          : null;

        if (!guest) {
          if (!orgId) {
            return NextResponse.json({ success: false, message: 'Organization not found for property.' }, { status: 400 });
          }
          guest = await prisma.guest.create({
            data: {
              organizationId: orgId,
              firstName,
              lastName,
              mobile: booking.guestPhone || null,
              email: booking.guestEmail || null,
              nationality: booking.guestNationality || 'Indian',
            },
          });
        }

        const bookingNo = `AGT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const createdRes = await prisma.reservation.create({
          data: {
            propertyId: booking.propertyId,
            guestId: guest.id,
            bookingNo,
            arrivalDate: booking.checkIn,
            departureDate: booking.checkOut,
            adults: booking.adults,
            children: booking.children,
            roomTypeId: primaryRoom.roomTypeId,
            assignedRoomId: primaryRoom.id,
            status: finalResStatus,
            totalAmount: updateData.totalAmount ?? booking.totalAmount,
            dueAmount: updateData.totalAmount ?? booking.totalAmount,
            rooms: {
              create: targetRooms.map((rm) => ({
                roomId: rm.id,
                ratePerNight: ratePerRoom,
                adults: Math.max(1, Math.floor(booking.adults / targetRooms.length)),
                children: Math.floor(booking.children / targetRooms.length),
              })),
            },
          },
        });
        updateData.reservationId = createdRes.id;
      }

      // Update notes with allotted room numbers tag so all room numbers are clearly saved & visible
      const existingNotes = updateData.notes !== undefined ? updateData.notes : (booking.notes || '');
      const cleanedNotes = existingNotes
        .replace(/\[ALLOTTED_ROOM_IDS:[^\]]+\]\s*/gi, '')
        .replace(/\[ALLOTTED_ROOMS:[^\]]+\]\s*/gi, '')
        .trim();
      const allotmentTag = `[ALLOTTED_ROOM_IDS: ${targetRooms.map((r) => r.id).join(',')}]\n[ALLOTTED_ROOMS: ${targetRooms.map((r) => r.roomNumber).join(', ')}]`;
      updateData.notes = cleanedNotes ? `${cleanedNotes}\n${allotmentTag}` : allotmentTag;

      if (finalResStatus === 'CHECKED_IN') {
        await prisma.room.updateMany({
          where: { id: { in: targetRooms.map((r) => r.id) } },
          data: { status: 'OCCUPIED' },
        });
      }
    } else if (status === 'CANCELLED' && booking.reservationId) {
      await prisma.reservation.update({
        where: { id: booking.reservationId },
        data: { status: 'CANCELLED' },
      }).catch(() => {});
    } else if (status === 'CHECKED_IN' && booking.reservationId) {
      await prisma.reservation.update({
        where: { id: booking.reservationId },
        data: { status: 'CHECKED_IN' },
      }).catch(() => null);
      const resRooms = await prisma.reservationRoom.findMany({
        where: { reservationId: booking.reservationId },
        select: { roomId: true },
      });
      const roomIdsToOccupy = resRooms.map((r) => r.roomId).filter(Boolean) as string[];
      if (roomIdsToOccupy.length > 0) {
        await prisma.room.updateMany({
          where: { id: { in: roomIdsToOccupy } },
          data: { status: 'OCCUPIED' },
        }).catch(() => {});
      }
    }

    const updated = await prisma.agentBooking.update({ where: { id }, data: updateData });

    // If marking commission paid, update agent total earnings
    if (commissionPaid === true && !booking.commissionPaid) {
      await prisma.travelAgent.update({
        where: { id: booking.agentId },
        data: { totalEarnings: { increment: booking.commission } },
      });
    }

    // If edited by agent, create in-app notification & sound alert for the hotel front office
    if (isEditResubmission) {
      await prisma.notification.create({
        data: {
          propertyId: booking.propertyId,
          title: `🔔 Agent Booking Edited: ${updateData.guestName || booking.guestName}`,
          message: `${updateData.roomType || booking.roomType} updated by ${booking.agent.name}. Total: ₹${Number(updateData.totalAmount || booking.totalAmount).toLocaleString()} (Commission: ₹${Number(updateData.commission || booking.commission).toLocaleString()}). Re-approval required.`,
          type: 'AGENT_BOOKING',
          status: 'UNREAD',
          priority: 'HIGH',
          metadata: JSON.stringify({
            bookingId: booking.id,
            agentId: booking.agentId,
            agentName: booking.agent.name,
            guestName: updateData.guestName || booking.guestName,
            roomType: updateData.roomType || booking.roomType,
            totalAmount: updateData.totalAmount || booking.totalAmount,
            commission: updateData.commission || booking.commission,
            link: '/hotel/agent-bookings',
            isEdit: true,
          }),
        },
      }).catch((err) => {
        console.error('[AgentBooking] Failed to notify on edit:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: isEditResubmission
        ? 'Booking updated successfully! Sent to hotel front desk for approval.'
        : 'Booking updated.',
    });
  } catch (error: any) {
    return apiError(error);
  }
}
