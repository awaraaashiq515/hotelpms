/**
 * src/server/services/nightAudit.service.ts
 * WP-0.8: Real, Idempotent Night Audit Service.
 * Ensures running twice on same business date does not double-post charges.
 */

import { prisma } from '@/lib/prisma';
import { businessDate as getBizDate, parseBusinessDate } from '@/lib/time';

export async function runNightAudit(propertyId: string, performedBy: string = 'SYSTEM') {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, timezone: true, businessDate: true },
  });

  const tz = property?.timezone || 'Asia/Kolkata';
  const currentBizDate = property?.businessDate
    ? getBizDate(tz, property.businessDate)
    : getBizDate(tz);

  // 1. Idempotency Check: if already completed for this date, return success without re-posting
  const existingRun = await prisma.nightAuditRun.findUnique({
    where: {
      propertyId_businessDate: {
        propertyId,
        businessDate: currentBizDate,
      },
    },
  });

  if (existingRun && existingRun.status === 'COMPLETED') {
    return {
      success: true,
      alreadyCompleted: true,
      businessDate: currentBizDate,
      message: `Night audit already completed for ${currentBizDate}`,
    };
  }

  // 2. Initialize or reuse run record
  const run = existingRun
    ? existingRun
    : await prisma.nightAuditRun.create({
        data: {
          propertyId,
          businessDate: currentBizDate,
          status: 'IN_PROGRESS',
          performedBy,
        },
      });

  // 3. Post room tariff charges to in-house guests for this date
  const activeCheckIns = await prisma.checkIn.findMany({
    where: {
      room: { propertyId },
      status: 'ACTIVE',
    },
    include: {
      reservation: {
        include: {
          folios: true,
          roomType: true,
        },
      },
      room: true,
    },
  });

  let postedCount = 0;
  for (const checkIn of activeCheckIns) {
    const folio = checkIn.reservation.folios[0];
    if (!folio) continue;

    // Check if room charge already posted for this date
    const alreadyPosted = await prisma.folioTransaction.findFirst({
      where: {
        folioId: folio.id,
        sourceModule: 'NIGHT_AUDIT',
        sourceRefId: `${run.id}_${currentBizDate}`,
      },
    });

    if (!alreadyPosted) {
      const roomRate = checkIn.room.customRate || checkIn.reservation.roomType.baseRate || 0;
      const gstRate = roomRate > 7500 ? 0.18 : roomRate > 0 ? 0.05 : 0;
      const taxAmount = Math.round(roomRate * gstRate * 100) / 100;
      const cgst = gstRate > 0 ? taxAmount / 2 : 0;
      const sgst = gstRate > 0 ? taxAmount / 2 : 0;

      await prisma.folioTransaction.create({
        data: {
          folioId: folio.id,
          txnType: 'DEBIT',
          sourceModule: 'NIGHT_AUDIT',
          sourceRefId: `${run.id}_${currentBizDate}`,
          description: `Room Tariff - Night Audit (${currentBizDate})`,
          debitAmount: roomRate + taxAmount,
          creditAmount: 0,
          taxAmount,
          cgst,
          sgst,
          igst: 0,
          taxable: roomRate,
          sacCode: '996311',
          netAmount: roomRate + taxAmount,
        },
      });

      // Update folio closing balance
      await prisma.folio.update({
        where: { id: folio.id },
        data: {
          totalCharges: { increment: roomRate + taxAmount },
          closingBalance: { increment: roomRate + taxAmount },
        },
      });

      postedCount++;
    }
  }

  // 4. Roll Property Business Date to next calendar day
  const currentDateObj = parseBusinessDate(currentBizDate, tz);
  const nextDateObj = new Date(currentDateObj.getTime() + 24 * 60 * 60 * 1000);

  await prisma.property.update({
    where: { id: propertyId },
    data: { businessDate: nextDateObj },
  });

  // 5. Mark Run as COMPLETED
  const updatedRun = await prisma.nightAuditRun.update({
    where: { id: run.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      summary: JSON.stringify({
        roomsCharged: postedCount,
        businessDateRolledFrom: currentBizDate,
        businessDateRolledTo: getBizDate(tz, nextDateObj),
      }),
    },
  });

  return {
    success: true,
    alreadyCompleted: false,
    businessDate: currentBizDate,
    nextBusinessDate: getBizDate(tz, nextDateObj),
    roomsCharged: postedCount,
    run: updatedRun,
  };
}
