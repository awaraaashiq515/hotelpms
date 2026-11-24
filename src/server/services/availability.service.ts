/**
 * src/server/services/availability.service.ts
 * WP-0.2: Inventory and availability engine (no double booking).
 * Checks reservations & maintenance room blocks across date ranges.
 */

import { prisma } from '@/lib/prisma';

export interface AvailabilityCheckParams {
  propertyId: string;
  roomId: string;
  checkIn: Date | string;
  checkOut: Date | string;
  excludeReservationId?: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflictingReservationId?: string;
  conflictingBlockId?: string;
  reason?: string;
}

/**
 * Checks if a specific room is available between checkIn and checkOut.
 * Overlap condition:
 *   existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
 */
export async function checkRoomAvailability({
  propertyId,
  roomId,
  checkIn,
  checkOut,
  excludeReservationId,
}: AvailabilityCheckParams): Promise<AvailabilityResult> {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkInDate >= checkOutDate) {
    return {
      available: false,
      reason: 'Check-out date must be after check-in date',
    };
  }

  // 1. Check existing active reservations for this room
  const conflictingRes = await prisma.reservation.findFirst({
    where: {
      propertyId,
      assignedRoomId: roomId,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'RESERVED'] },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      arrivalDate: { lt: checkOutDate },
      departureDate: { gt: checkInDate },
    },
    select: { id: true, bookingNo: true, status: true },
  });

  if (conflictingRes) {
    return {
      available: false,
      conflictingReservationId: conflictingRes.id,
      reason: `Room is already reserved (${conflictingRes.bookingNo})`,
    };
  }

  // 2. Check active room blocks (Maintenance, OOO, etc.)
  const conflictingBlock = await prisma.roomBlock.findFirst({
    where: {
      propertyId,
      roomId,
      status: 'ACTIVE',
      startDate: { lt: checkOutDate },
      endDate: { gt: checkInDate },
    },
    select: { id: true, reason: true },
  });

  if (conflictingBlock) {
    return {
      available: false,
      conflictingBlockId: conflictingBlock.id,
      reason: `Room is blocked: ${conflictingBlock.reason}`,
    };
  }

  return { available: true };
}

/**
 * Gets count of available rooms for a room type over date range.
 */
export async function getRoomTypeAvailability(
  propertyId: string,
  roomTypeId: string,
  checkIn: Date | string,
  checkOut: Date | string
): Promise<{ totalRooms: number; bookedRooms: number; availableRooms: number }> {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Total rooms for category
  const totalRooms = await prisma.room.count({
    where: { propertyId, roomTypeId },
  });

  // Booked rooms
  const bookedReservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      roomTypeId,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'RESERVED'] },
      arrivalDate: { lt: checkOutDate },
      departureDate: { gt: checkInDate },
    },
    select: { assignedRoomId: true },
  });

  const bookedCount = bookedReservations.length;
  const availableCount = Math.max(0, totalRooms - bookedCount);

  return {
    totalRooms,
    bookedRooms: bookedCount,
    availableRooms: availableCount,
  };
}
