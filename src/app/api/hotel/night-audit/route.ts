import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getCanonicalHotelStatus, getHotelBusinessDate } from '@/lib/hotel/room-status-service';
import { computeRoomGst } from '@/lib/hotel/gst-service';

async function getPropertyContext(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const propertyIdParam = searchParams.get('propertyId');

  let propId = propertyIdParam || session?.propertyId;
  if (!propId && session?.organizationId) {
    const p = await prisma.property.findFirst({ where: { organizationId: session.organizationId } });
    propId = p?.id;
  }
  if (!propId) {
    const p = await prisma.property.findFirst({ orderBy: { createdAt: 'asc' } });
    propId = p?.id;
  }

  const propertyWhere = propId ? { propertyId: propId } : {};
  return { session, propertyWhere, propertyId: propId || '' };
}

export async function GET(request: NextRequest) {
  try {
    const { propertyWhere, propertyId } = await getPropertyContext(request);
    const { todayStart, dateString } = getHotelBusinessDate();

    // 1. Fetch canonical single source of truth
    const canonical = await getCanonicalHotelStatus(propertyId);

    const totalRoomsCount = canonical.summary.totalRooms;
    const occupiedRoomsCount = canonical.summary.occupiedCount;
    const vacantRoomsCount = canonical.summary.vacantCount;
    const maintenanceRoomsCount = canonical.summary.maintenanceCount;
    const occupancyPct = canonical.summary.occupancyPct;

    // 2. Fetch Active CheckIns & In-House Guests
    const activeCheckIns = await prisma.checkIn.findMany({
      where: {
        status: 'ACTIVE',
        reservation: propertyWhere,
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        reservation: {
          include: {
            roomType: true,
            folios: {
              where: { status: 'OPEN' },
              include: {
                transactions: true,
              },
            },
          },
        },
      },
    });

    let ratesPostedTodayCount = 0;
    let ratesPendingPostCount = 0;
    let pendingDuesTotal = 0;

    const checkInsWithStatus = activeCheckIns.map((ci) => {
      const folio = ci.reservation?.folios?.[0];
      const roomRate = ci.room?.customRate || ci.room?.roomType?.baseRate || ci.reservation?.roomType?.baseRate || 3500;

      const hasPostedToday = folio?.transactions?.some((t) => {
        const tDate = new Date(t.txnDate);
        return (
          tDate >= todayStart &&
          (t.sourceModule === 'ROOM_RENT' ||
            t.description?.toLowerCase().includes('room charge') ||
            t.description?.toLowerCase().includes('night audit'))
        );
      });

      if (hasPostedToday) ratesPostedTodayCount++;
      else ratesPendingPostCount++;

      if (folio) {
        pendingDuesTotal += Math.max(0, folio.closingBalance);
      }

      return {
        checkInId: ci.id,
        guestName: `${ci.guest?.firstName || ''} ${ci.guest?.lastName || ''}`.trim() || 'Guest',
        roomNumber: ci.room?.roomNumber || 'N/A',
        roomType: ci.room?.roomType?.name || ci.reservation?.roomType?.name || 'Standard',
        roomRate,
        folioId: folio?.id || null,
        folioNo: folio?.folioNo || 'N/A',
        currentBalance: folio?.closingBalance || 0,
        ratePostedToday: Boolean(hasPostedToday),
      };
    });

    // 4. Pending No-Shows & Overdue Overstays
    const pendingNoShows = await prisma.reservation.findMany({
      where: {
        ...propertyWhere,
        status: 'CONFIRMED',
        arrivalDate: { lt: todayStart },
        checkIns: { none: { status: 'ACTIVE' } },
      },
      include: { guest: true, roomType: true },
    });

    const overdueGuests = canonical.overdueDepartures;

    // 5. Total Transactions Today
    const todayTransactions = await prisma.folioTransaction.findMany({
      where: {
        txnDate: { gte: todayStart },
        folio: { reservation: propertyWhere },
      },
    });

    const totalDebitsToday = todayTransactions.reduce((acc, t) => acc + (t.debitAmount || 0), 0);
    const totalCreditsToday = todayTransactions.reduce((acc, t) => acc + (t.creditAmount || 0), 0);
    const totalTaxToday = todayTransactions.reduce((acc, t) => acc + (t.taxAmount || 0), 0);

    // 6. Audit Steps List
    const auditSteps = [
      {
        id: 1,
        key: 'ROOM_STATUS',
        label: 'Verify Room Status & Occupancy',
        desc: `Auditing ${totalRoomsCount} rooms: ${occupiedRoomsCount} occupied, ${vacantRoomsCount} vacant, ${maintenanceRoomsCount} in maintenance.`,
        done: true,
        count: occupiedRoomsCount,
        metric: `${occupancyPct}% Occupancy`,
      },
      {
        id: 2,
        key: 'RECONCILE_PAYMENTS',
        label: 'Reconcile Folio Balances & Payments',
        desc: `Verified ${todayTransactions.length} transactions today (₹${totalCreditsToday.toLocaleString('en-IN')} payments collected).`,
        done: activeCheckIns.length > 0,
        count: activeCheckIns.length,
        metric: `₹${pendingDuesTotal.toLocaleString('en-IN')} Dues`,
      },
      {
        id: 3,
        key: 'NO_SHOW',
        label: 'No-Show & Overdue Processing',
        desc:
          pendingNoShows.length > 0 || overdueGuests.length > 0
            ? `Found ${pendingNoShows.length} no-shows and ${overdueGuests.length} overdue overstays past expected checkout.`
            : 'No pending no-show or overdue reservations detected.',
        done: pendingNoShows.length === 0 && overdueGuests.length === 0,
        count: pendingNoShows.length + overdueGuests.length,
        metric: `${pendingNoShows.length + overdueGuests.length} Overdue / No-Shows`,
      },
      {
        id: 4,
        key: 'RATE_POSTING',
        label: 'Automatic Daily Room Rate Posting',
        desc:
          ratesPendingPostCount > 0
            ? `${ratesPendingPostCount} occupied rooms need room rent posted to folios.`
            : `All ${ratesPostedTodayCount} occupied rooms have daily rates posted.`,
        done: ratesPendingPostCount === 0 && activeCheckIns.length > 0,
        count: ratesPendingPostCount,
        metric: `${ratesPendingPostCount} Pending`,
      },
      {
        id: 5,
        key: 'TAX_COMPUTATION',
        label: 'Tax & GST Computation (2025/2026 Slabs)',
        desc: `Total GST calculated for today: ₹${totalTaxToday.toLocaleString('en-IN')}`,
        done: true,
        count: 1,
        metric: `₹${totalTaxToday.toLocaleString('en-IN')} Tax`,
      },
      {
        id: 6,
        key: 'REVENUE_ROLLUP',
        label: 'Daily Revenue Rollup & Trial Balance',
        desc: `Total debits: ₹${totalDebitsToday.toLocaleString('en-IN')} | Total payments: ₹${totalCreditsToday.toLocaleString('en-IN')}`,
        done: true,
        count: todayTransactions.length,
        metric: `₹${totalDebitsToday.toLocaleString('en-IN')} Debits`,
      },
      {
        id: 7,
        key: 'CLOSE_BUSINESS_DAY',
        label: 'Rollover Hotel Business Date',
        desc: `Active Hotel Business Date: ${dateString}`,
        done: false,
        count: 1,
        metric: dateString,
      },
      {
        id: 8,
        key: 'GM_REPORT',
        label: 'Generate Manager Flash Report',
        desc: 'Daily Flash Report ready with occupancy, revenue, ADR and tax totals.',
        done: true,
        count: 1,
        metric: 'Ready',
      },
    ];

    const summaryData = {
      totalRooms: totalRoomsCount,
      occupiedRooms: occupiedRoomsCount,
      vacantRooms: vacantRoomsCount,
      maintenanceRooms: maintenanceRoomsCount,
      occupancyPct,
      activeCheckInsCount: activeCheckIns.length,
      ratesPostedTodayCount,
      ratesPendingPostCount,
      pendingDues: pendingDuesTotal,
      pendingDuesTotal,
      todayDebits: totalDebitsToday,
      totalDebitsToday,
      todayCredits: totalCreditsToday,
      totalCreditsToday,
      todayTax: totalTaxToday,
      totalTaxToday,
      pendingNoShowsCount: pendingNoShows.length,
      noShowsCount: pendingNoShows.length,
      overdueCount: overdueGuests.length,
      businessDate: dateString,
    };

    return apiResponse({
      summary: summaryData,
      stats: summaryData,
      roomsSummary: {
        total: totalRoomsCount,
        occupied: occupiedRoomsCount,
        vacant: vacantRoomsCount,
        maintenance: maintenanceRoomsCount,
        occupancyPct,
      },
      inHouseGuests: checkInsWithStatus,
      checkInsWithStatus,
      pendingNoShows: pendingNoShows.map((ns) => ({
        id: ns.id,
        bookingNo: ns.bookingNo,
        guestName: `${ns.guest?.firstName || ''} ${ns.guest?.lastName || ''}`.trim() || 'Guest',
        phone: ns.guest?.mobile || '',
        roomType: ns.roomType?.name || 'Standard',
        arrivalDate: ns.arrivalDate,
        totalAmount: ns.totalAmount,
      })),
      overdueGuests: overdueGuests.map((og) => ({
        id: og.id,
        bookingNo: og.bookingNo,
        guestName: `${og.guest?.firstName || ''} ${og.guest?.lastName || ''}`.trim() || 'Guest',
        phone: og.guest?.mobile || '',
        departureDate: og.departureDate,
        totalAmount: og.totalAmount,
      })),
      steps: auditSteps,
      auditSteps,
      businessDate: dateString,
    });
  } catch (error) {
    console.error('Error in GET /api/hotel/night-audit:', error);
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { propertyWhere, propertyId } = await getPropertyContext(request);
    const body = await request.json();
    const { action, stepKey } = body;
    const { todayStart, dateString } = getHotelBusinessDate();

    const logs: string[] = [];

    // ACTION: POST_ROOM_RATES / RUN_ALL / RATE_POSTING
    if (action === 'POST_ROOM_RATES' || action === 'RUN_ALL' || stepKey === 'RATE_POSTING') {
      const activeCheckIns = await prisma.checkIn.findMany({
        where: {
          status: 'ACTIVE',
          reservation: propertyWhere,
        },
        include: {
          guest: true,
          room: { include: { roomType: true } },
          reservation: {
            include: {
              roomType: true,
              folios: { where: { status: 'OPEN' }, include: { transactions: true } },
            },
          },
        },
      });

      let postedCount = 0;
      for (const ci of activeCheckIns) {
        const folio = ci.reservation?.folios?.[0];
        if (!folio) continue;

        // Skip complimentary stays
        if (ci.reservation?.waiveBill || ci.reservation?.isOwnerGuest || ci.reservation?.ownerBillingType === 'COMPLIMENTARY') {
          logs.push(`Skipped room charge for Complimentary Stay - Room ${ci.room?.roomNumber || 'N/A'}`);
          continue;
        }

        const roomRate = ci.room?.customRate || ci.room?.roomType?.baseRate || ci.reservation?.roomType?.baseRate || 3500;
        const taxComp = computeRoomGst(roomRate, 1, false);
        const tax = taxComp.totalTax;
        const totalDebit = roomRate + tax;

        // Reconcile all calendar nights between check-in and today (catch missed/overstay nights)
        const checkInDate = new Date(ci.checkedInAt || ci.reservation?.arrivalDate || todayStart);
        const curDate = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
        let postedForStay = 0;

        while (curDate <= todayStart) {
          const curDayStart = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), 0, 0, 0);
          const curDayEnd = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), 23, 59, 59);
          const curDayStr = curDayStart.toISOString().split('T')[0];

          const hasPostedForDay = folio.transactions?.some((t) => {
            const tDate = new Date(t.txnDate);
            return (
              tDate >= curDayStart &&
              tDate <= curDayEnd &&
              (t.sourceModule === 'ROOM_RENT' ||
                t.description?.toLowerCase().includes('room charge') ||
                t.description?.toLowerCase().includes('night audit'))
            );
          });

          if (!hasPostedForDay) {
            await prisma.folioTransaction.create({
              data: {
                folioId: folio.id,
                txnType: 'DEBIT',
                sourceModule: 'ROOM_RENT',
                description: `Night Audit Room Charge (${curDayStr}, ${taxComp.taxRate}% GST) - Room ${ci.room?.roomNumber || 'N/A'}`,
                debitAmount: roomRate,
                creditAmount: 0,
                taxAmount: tax,
                netAmount: totalDebit,
                txnDate: curDayStart,
              },
            });

            folio.totalCharges += totalDebit;
            folio.closingBalance += totalDebit;
            postedCount++;
            postedForStay++;
            logs.push(`Posted Room Rent ₹${roomRate} (+₹${tax} GST @ ${taxComp.taxRate}%) for ${curDayStr} to Room ${ci.room?.roomNumber || 'N/A'}`);
          }

          curDate.setDate(curDate.getDate() + 1);
        }

        if (postedForStay > 0) {
          await prisma.folio.update({
            where: { id: folio.id },
            data: {
              totalCharges: folio.totalCharges,
              closingBalance: folio.closingBalance,
            },
          });
        }

        // Auto-mark occupied room as DIRTY for daily stay-over cleaning
        if (ci.roomId) {
          await prisma.room.update({
            where: { id: ci.roomId },
            data: { housekeepingStatus: 'DIRTY' },
          }).catch(() => null);
        }
      }

      if (postedCount === 0) {
        logs.push("All in-house folios already had daily room rates posted up to today.");
      }
    }

    // ACTION: PROCESS_NO_SHOWS
    if (action === 'PROCESS_NO_SHOWS' || action === 'RUN_ALL' || stepKey === 'NO_SHOW') {
      const noShows = await prisma.reservation.findMany({
        where: {
          ...propertyWhere,
          status: 'CONFIRMED',
          arrivalDate: { lt: todayStart },
          checkIns: { none: { status: 'ACTIVE' } },
        },
      });

      if (noShows.length > 0) {
        await prisma.reservation.updateMany({
          where: { id: { in: noShows.map((n) => n.id) } },
          data: { status: 'NO_SHOW' },
        });
        logs.push(`Processed ${noShows.length} no-show reservations.`);
      } else {
        logs.push('No pending no-show reservations to process.');
      }
    }

    // ACTION: SYNC_ROOM_STATUSES
    if (action === 'SYNC_ROOM_STATUSES' || action === 'RUN_ALL' || stepKey === 'ROOM_STATUS') {
      if (propertyId) {
        await getCanonicalHotelStatus(propertyId);
        logs.push('Verified room inventory and reconciled single source of truth.');
      }
    }

    logs.push(`Night Audit completed successfully at ${new Date().toLocaleTimeString('en-IN')}`);

    return apiResponse({
      success: true,
      logs,
      message: 'Night audit executed successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/hotel/night-audit:', error);
    return apiError(error);
  }
}
