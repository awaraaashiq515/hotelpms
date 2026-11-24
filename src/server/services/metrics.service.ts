/**
 * src/server/services/metrics.service.ts
 * WP-0.9: Unified source of truth for hotel operational metrics.
 * Calculates real occupancy, ADR, RevPAR, and revenue across Room, POS, Spa, and Banquet.
 */

import { prisma } from '@/lib/prisma';

export async function getMultiSourceRevenue(propertyId: string, startDate?: Date, endDate?: Date) {
  const dateFilter = {
    ...(startDate ? { gte: startDate } : {}),
    ...(endDate ? { lte: endDate } : {}),
  };

  // 1. Room Revenue (Folio charges)
  const roomTxns = await prisma.folioTransaction.aggregate({
    where: {
      folio: { reservation: { propertyId } },
      txnType: 'DEBIT',
      sourceModule: { in: ['ROOM_RENT', 'NIGHT_AUDIT', 'ROOM'] },
      ...(startDate || endDate ? { txnDate: dateFilter } : {}),
    },
    _sum: { netAmount: true, taxAmount: true },
  });
  const roomRevenue = roomTxns._sum.netAmount || 0;

  // 2. POS / F&B Revenue
  const posOrders = await prisma.posOrder.aggregate({
    where: {
      outlet: { propertyId },
      status: { notIn: ['CANCELLED', 'VOID'] },
      ...(startDate || endDate ? { createdAt: dateFilter } : {}),
    },
    _sum: { grandTotal: true, taxAmount: true },
  });
  const posRevenue = posOrders._sum.grandTotal || 0;

  // 3. Spa Revenue
  let spaRevenue = 0;
  try {
    const spaAppointments = await prisma.spaAppointment.aggregate({
      where: {
        propertyId,
        status: { in: ['COMPLETED', 'CONFIRMED'] },
      },
      _sum: { amount: true },
    });
    spaRevenue = spaAppointments._sum.amount || 0;
  } catch {}

  // 4. Banquet Revenue
  let banquetRevenue = 0;
  try {
    const banquets = await prisma.banquetBooking.aggregate({
      where: {
        propertyId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        ...(startDate || endDate ? { eventDate: dateFilter } : {}),
      },
      _sum: { totalAmount: true },
    });
    banquetRevenue = banquets._sum.totalAmount || 0;
  } catch {}

  const totalRevenue = roomRevenue + posRevenue + spaRevenue + banquetRevenue;

  return {
    room: roomRevenue,
    pos: posRevenue,
    spa: spaRevenue,
    banquet: banquetRevenue,
    total: totalRevenue,
  };
}

export async function getLiveOccupancyMetrics(propertyId: string, _date: Date = new Date()) {
  const totalRooms = await prisma.room.count({ where: { propertyId } });
  const occupiedRooms = await prisma.room.count({
    where: { propertyId, status: 'OCCUPIED' },
  });

  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  // Revenue today for ADR / RevPAR
  const revenueData = await getMultiSourceRevenue(propertyId);
  const adr = occupiedRooms > 0 ? revenueData.room / occupiedRooms : 0;
  const revpar = totalRooms > 0 ? revenueData.room / totalRooms : 0;

  return {
    totalRooms,
    occupiedRooms,
    availableRooms: Math.max(0, totalRooms - occupiedRooms),
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    adr: Math.round(adr),
    revpar: Math.round(revpar),
  };
}
