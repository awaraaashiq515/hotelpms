import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

async function getPropertyContext(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const propertyIdParam = searchParams.get('propertyId');
  if (session) {
    const propertyWhere = getMultiTenantWhere(session, propertyIdParam);
    return { session, propertyWhere };
  }
  let prop = null;
  if (propertyIdParam) {
    prop = await prisma.property.findUnique({ where: { id: propertyIdParam } });
  }
  if (!prop) {
    prop = await prisma.property.findFirst({ orderBy: { createdAt: 'asc' } });
  }
  const propertyWhere = prop ? { propertyId: prop.id } : {};
  return { session: null, propertyWhere, prop };
}

function r2(n: number) { return Math.round(n * 100) / 100; }

export async function GET(request: NextRequest) {
  try {
    const { propertyWhere, session } = await getPropertyContext(request);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const reportDate = dateParam ? new Date(dateParam) : new Date();

    const todayStart = new Date(reportDate); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(reportDate); todayEnd.setHours(23, 59, 59, 999);
    const mtdStart   = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1, 0, 0, 0);
    const ytdStart   = new Date(reportDate.getFullYear(), 0, 1, 0, 0, 0);
    const ytdEnd     = new Date(todayEnd);

    let propertyId: string | undefined;
    if ('propertyId' in propertyWhere) propertyId = (propertyWhere as any).propertyId;

    let hotelName = 'Hotel Manor Manali';
    if (propertyId) {
      const property = await prisma.property.findUnique({ where: { id: propertyId } }).catch(() => null);
      if (property?.name) hotelName = property.name;
    }
    if (hotelName === 'Hotel Manor Manali') {
      const firstProp = await prisma.property.findFirst({ orderBy: { createdAt: 'asc' } }).catch(() => null);
      if (firstProp?.name) hotelName = firstProp.name;
    }

    // ─── FOLIO TRANSACTIONS ───────────────────────────────────
    const allTxns = await prisma.folioTransaction.findMany({
      where: { txnDate: { gte: ytdStart, lte: ytdEnd }, folio: { reservation: propertyWhere } },
      select: { txnDate: true, txnType: true, sourceModule: true, description: true, debitAmount: true, creditAmount: true, taxAmount: true, netAmount: true },
    }).catch(() => []);

    function filterTxns(from: Date, to: Date) {
      return allTxns.filter(t => { const d = new Date(t.txnDate); return d >= from && d <= to; });
    }
    function sumDebit(txns: typeof allTxns, modules: string[], descKws: string[] = []) {
      return txns.filter(t => (modules.includes(t.sourceModule || '') || (descKws.length > 0 && descKws.some(k => (t.description || '').toLowerCase().includes(k)))) && (t.txnType === 'DEBIT' || t.debitAmount > 0)).reduce((s, t) => s + (t.debitAmount || 0), 0);
    }
    function sumTax(txns: typeof allTxns) { return txns.reduce((s, t) => s + (t.taxAmount || 0), 0); }

    function calcFO(txns: typeof allTxns) {
      const roomCharge   = sumDebit(txns, ['ROOM_RENT', 'ROOM_CHARGE'], ['room charge', 'night audit', 'room rate']);
      const extraBed     = sumDebit(txns, ['EXTRA_BED'], ['extra bed']);
      const roomDisc     = -Math.abs(txns.filter(t => (t.sourceModule === 'ROOM_DISCOUNT' || (t.description || '').toLowerCase().includes('room disc')) && t.txnType === 'CREDIT').reduce((s, t) => s + (t.creditAmount || 0), 0));
      const miscCharge   = sumDebit(txns, ['MISC', 'FRONT_OFFICE_MISC'], ['misc charge']);
      const retentionChg = sumDebit(txns, ['RETENTION'], ['retention']);
      const roundOff     = txns.filter(t => (t.description || '').toLowerCase().includes('round off') && !(t.description || '').toLowerCase().includes('pos')).reduce((s, t) => s + ((t.debitAmount || 0) - (t.creditAmount || 0)), 0);
      const total = roomCharge + extraBed + roomDisc + miscCharge + retentionChg + roundOff;
      return { roomCharge, extraBed, roomDisc, miscCharge, retentionChg, roundOff, total };
    }

    const todayFO = calcFO(filterTxns(todayStart, todayEnd));
    const mtdFO   = calcFO(filterTxns(mtdStart, todayEnd));
    const ytdFO   = calcFO(filterTxns(ytdStart, ytdEnd));

    // ─── POS ORDERS ───────────────────────────────────────────
    const allPosOrders = await prisma.posOrder.findMany({
      where: { propertyId, status: { in: ['COMPLETED', 'PAID', 'SERVED'] }, createdAt: { gte: ytdStart, lte: ytdEnd } },
      include: { outlet: { select: { name: true, type: true } } },
    }).catch(() => []);

    function filterPos(from: Date, to: Date) {
      return allPosOrders.filter(o => { const d = new Date(o.createdAt); return d >= from && d <= to; });
    }
    function getOCat(o: typeof allPosOrders[0]) {
      const t = (o.outlet?.type || '').toUpperCase(), n = (o.outlet?.name || '').toUpperCase();
      if (t === 'LAUNDRY' || n.includes('LAUNDRY')) return 'LN';
      if (t === 'ROOM_SERVICE' || n.includes('ROOM SERVICE') || o.orderType === 'ROOM_SERVICE') return 'RS';
      if (t === 'BANQUET' || n.includes('BANQUET')) return 'BQ';
      return 'CAFE';
    }
    function calcPOS(orders: typeof allPosOrders) {
      const cafe = orders.filter(o => getOCat(o) === 'CAFE');
      const rs   = orders.filter(o => getOCat(o) === 'RS');
      const ln   = orders.filter(o => getOCat(o) === 'LN');
      const bq   = orders.filter(o => getOCat(o) === 'BQ');
      return {
        cafeFood: cafe.reduce((s, o) => s + (o.subtotal - o.discountAmount), 0),
        cafeBev: 0,
        cafeDisc: cafe.reduce((s, o) => s + o.discountAmount, 0),
        cafeTotal: cafe.reduce((s, o) => s + o.grandTotal, 0),
        rsFood: rs.reduce((s, o) => s + o.subtotal, 0),
        rsDisc: rs.reduce((s, o) => s + o.discountAmount, 0),
        rsTotal: rs.reduce((s, o) => s + o.grandTotal, 0),
        lnMisc: ln.reduce((s, o) => s + o.subtotal, 0),
        lnDisc: ln.reduce((s, o) => s + o.discountAmount, 0),
        lnTotal: ln.reduce((s, o) => s + o.grandTotal, 0),
        bqTotal: bq.reduce((s, o) => s + o.grandTotal, 0),
        tax: orders.reduce((s, o) => s + (o.taxAmount || 0), 0),
      };
    }

    const todayPos = calcPOS(filterPos(todayStart, todayEnd));
    const mtdPos   = calcPOS(filterPos(mtdStart, todayEnd));
    const ytdPos   = calcPOS(filterPos(ytdStart, ytdEnd));

    function calcTax(txns: typeof allTxns, pos: ReturnType<typeof calcPOS>) {
      const total = sumTax(txns) + pos.tax;
      return { cgst: r2(total / 2), sgst: r2(total / 2), total: r2(total) };
    }

    const todayTax = calcTax(filterTxns(todayStart, todayEnd), todayPos);
    const mtdTax   = calcTax(filterTxns(mtdStart, todayEnd), mtdPos);
    const ytdTax   = calcTax(filterTxns(ytdStart, ytdEnd), ytdPos);

    function totalRev(fo: ReturnType<typeof calcFO>, pos: ReturnType<typeof calcPOS>) {
      return r2(fo.total + pos.cafeTotal + pos.rsTotal + pos.lnTotal + pos.bqTotal);
    }

    // ─── PAYMENTS & FOLIO SETTLEMENTS ──────────────────────────
    const allPayments = await prisma.payment.findMany({
      where: { ...(propertyId ? { propertyId } : {}), paymentDate: { gte: ytdStart, lte: ytdEnd } },
      include: { paymentMode: { select: { name: true, type: true } } },
    }).catch(() => []);

    function calcPmts(from: Date, to: Date) {
      const filteredPmts = allPayments.filter(p => { const d = new Date(p.paymentDate); return d >= from && d <= to; });
      const cat = (p: typeof allPayments[0], kw: string[]) => kw.some(k => (p.paymentMode?.name || '').toUpperCase().includes(k) || (p.paymentMode?.type || '').toUpperCase().includes(k));

      // Also include Folio CREDIT transactions (guest payments, advances, checkout settlements)
      const filteredFolioCredits = allTxns.filter(t => {
        const d = new Date(t.txnDate);
        return d >= from && d <= to && t.txnType === 'CREDIT' && t.sourceModule !== 'DISCOUNT' && (t.creditAmount || 0) > 0;
      });

      let cash = filteredPmts.filter(p => cat(p, ['CASH'])).reduce((s, p) => s + p.amount, 0);
      let card = filteredPmts.filter(p => cat(p, ['CARD', 'CREDIT CARD', 'DEBIT CARD'])).reduce((s, p) => s + p.amount, 0);
      let upi  = filteredPmts.filter(p => cat(p, ['UPI'])).reduce((s, p) => s + p.amount, 0);
      let bank = filteredPmts.filter(p => cat(p, ['NEFT', 'BANK', 'HDFC', 'ICICI', 'IMPS'])).reduce((s, p) => s + p.amount, 0);
      let comp = filteredPmts.filter(p => cat(p, ['COMPANY', 'CITY LEDGER', 'CITY_LEDGER', 'BILL TO COMPANY'])).reduce((s, p) => s + p.amount, 0);

      for (const fc of filteredFolioCredits) {
        const desc = (fc.description || '').toLowerCase();
        const amt = fc.creditAmount || 0;
        if (desc.includes('cash')) {
          cash += amt;
        } else if (desc.includes('upi') || desc.includes('online') || desc.includes('gpay') || desc.includes('phonepe')) {
          upi += amt;
        } else if (desc.includes('card')) {
          card += amt;
        } else if (desc.includes('bank') || desc.includes('neft') || desc.includes('transfer')) {
          bank += amt;
        } else if (desc.includes('company') || desc.includes('city ledger') || desc.includes('bill to')) {
          comp += amt;
        } else {
          // Default advance paid / generic settlement
          cash += amt;
        }
      }

      const total = cash + card + upi + bank + comp;
      return { cash, creditCard: card, upi, bankTransfer: bank, cityLedger: comp, total };
    }

    const todayPmts = calcPmts(todayStart, todayEnd);
    const mtdPmts   = calcPmts(mtdStart, todayEnd);
    const ytdPmts   = calcPmts(ytdStart, ytdEnd);

    // ─── MISC RECEIPTS ────────────────────────────────────────
    const allReceipts = await prisma.receipt.findMany({
      where: { propertyId, receiptDate: { gte: ytdStart, lte: ytdEnd } },
    }).catch(() => []);
    const miscToday = allReceipts.filter(r => { const d = new Date(r.receiptDate); return d >= todayStart && d <= todayEnd; }).reduce((s, r) => s + r.amount, 0);
    const miscMTD   = allReceipts.filter(r => { const d = new Date(r.receiptDate); return d >= mtdStart && d <= todayEnd; }).reduce((s, r) => s + r.amount, 0);
    const miscYTD   = allReceipts.filter(r => { const d = new Date(r.receiptDate); return d >= ytdStart && d <= ytdEnd; }).reduce((s, r) => s + r.amount, 0);

    // ─── OCCUPANCY ────────────────────────────────────────────
    const rooms = await prisma.room.findMany({ where: propertyWhere, include: { roomType: { select: { name: true, baseRate: true } } } }).catch(() => []);
    const totalRooms = rooms.length;

    const activeCheckIns = await prisma.checkIn.findMany({
      where: { status: 'ACTIVE', reservation: propertyWhere },
      include: { room: { include: { roomType: { select: { name: true, baseRate: true } } } }, reservation: { include: { roomType: { select: { name: true, baseRate: true } } } } },
    }).catch(() => []);

    const occupiedRooms = activeCheckIns.length;
    const vacantRooms   = Math.max(0, totalRooms - occupiedRooms);
    const occupancyPct  = totalRooms > 0 ? r2((occupiedRooms / totalRooms) * 100) : 0;
    const compRooms = activeCheckIns.filter(ci => (ci.room?.customRate ?? ci.reservation?.roomType?.baseRate ?? 0) === 0).length;

    // Room-type wise
    const rtMap: Record<string, { rented: number; adr: number; revenue: number }> = {};
    for (const ci of activeCheckIns) {
      const rn = ci.room?.roomType?.name || ci.reservation?.roomType?.name || 'Standard';
      const rt = ci.room?.customRate ?? ci.room?.roomType?.baseRate ?? ci.reservation?.roomType?.baseRate ?? 0;
      if (!rtMap[rn]) rtMap[rn] = { rented: 0, adr: 0, revenue: 0 };
      rtMap[rn].rented++;
      rtMap[rn].revenue += rt;
    }
    for (const k of Object.keys(rtMap)) {
      rtMap[k].adr = rtMap[k].rented > 0 ? r2(rtMap[k].revenue / rtMap[k].rented) : 0;
    }

    const allCI = await prisma.checkIn.findMany({ where: { reservation: propertyWhere, checkedInAt: { gte: ytdStart, lte: ytdEnd } } }).catch(() => []);
    const allCO = await prisma.checkOut.findMany({ where: { checkIn: { reservation: propertyWhere }, checkedOutAt: { gte: ytdStart, lte: ytdEnd } } }).catch(() => []);

    const fn = (arr: typeof allCI, f: Date, t: Date, key: 'checkedInAt') => arr.filter(x => { const d = new Date(x[key]); return d >= f && d <= t; }).length;
    const fnCO = (arr: typeof allCO, f: Date, t: Date) => arr.filter(x => { const d = new Date(x.checkedOutAt); return d >= f && d <= t; }).length;

    const todayCI = fn(allCI, todayStart, todayEnd, 'checkedInAt');
    const todayCO = fnCO(allCO, todayStart, todayEnd);
    const mtdCI   = fn(allCI, mtdStart, todayEnd, 'checkedInAt');
    const mtdCO   = fnCO(allCO, mtdStart, todayEnd);
    const ytdCI   = fn(allCI, ytdStart, ytdEnd, 'checkedInAt');
    const ytdCO   = fnCO(allCO, ytdStart, ytdEnd);

    const pax = activeCheckIns.reduce((s, ci) => s + ((ci.reservation?.adults || 1) + (ci.reservation?.children || 0)), 0);

    const mtdRevRoom = r2(mtdFO.roomCharge + mtdFO.extraBed);
    const ytdRevRoom = r2(ytdFO.roomCharge + ytdFO.extraBed);
    const mtdNights = mtdCI;
    const ytdNights = ytdCI;
    const mtdADR = mtdNights > 0 ? r2(mtdRevRoom / mtdNights) : 0;
    const ytdADR = ytdNights > 0 ? r2(ytdRevRoom / ytdNights) : 0;
    const todayRoomRev = r2(todayFO.roomCharge + todayFO.extraBed);
    const todayADR = occupiedRooms > 0 ? r2(todayRoomRev / occupiedRooms) : 0;

    return apiResponse({
      reportDate: reportDate.toISOString(),
      hotelName,
      generatedAt: new Date().toISOString(),
      generatedBy: (session as any)?.fullName || (session as any)?.email || 'System',
      salesSummary: {
        frontOffice: {
          miscCharge:      { today: r2(todayFO.miscCharge),    mtd: r2(mtdFO.miscCharge),    ytd: r2(ytdFO.miscCharge) },
          retentionCharge: { today: r2(todayFO.retentionChg),  mtd: r2(mtdFO.retentionChg),  ytd: r2(ytdFO.retentionChg) },
          roomDiscount:    { today: r2(todayFO.roomDisc),       mtd: r2(mtdFO.roomDisc),       ytd: r2(ytdFO.roomDisc) },
          extraBed:        { today: r2(todayFO.extraBed),       mtd: r2(mtdFO.extraBed),       ytd: r2(ytdFO.extraBed) },
          roomCharge:      { today: r2(todayFO.roomCharge),     mtd: r2(mtdFO.roomCharge),     ytd: r2(ytdFO.roomCharge) },
          roundOff:        { today: r2(todayFO.roundOff),       mtd: r2(mtdFO.roundOff),       ytd: r2(ytdFO.roundOff) },
          total:           { today: r2(todayFO.total),           mtd: r2(mtdFO.total),           ytd: r2(ytdFO.total) },
        },
        mealCharge: { total: { today: 0, mtd: 0, ytd: 0 } },
        roomService: {
          food:    { today: r2(todayPos.rsFood),  mtd: r2(mtdPos.rsFood),  ytd: r2(ytdPos.rsFood) },
          beverage:{ today: 0, mtd: 0, ytd: 0 },
          total:   { today: r2(todayPos.rsTotal), mtd: r2(mtdPos.rsTotal), ytd: r2(ytdPos.rsTotal) },
        },
        laundry: {
          miscellaneous: { today: r2(todayPos.lnMisc),  mtd: r2(mtdPos.lnMisc),  ytd: r2(ytdPos.lnMisc) },
          discount:      { today: r2(todayPos.lnDisc),  mtd: r2(mtdPos.lnDisc),  ytd: r2(ytdPos.lnDisc) },
          total:         { today: r2(todayPos.lnTotal), mtd: r2(mtdPos.lnTotal), ytd: r2(ytdPos.lnTotal) },
        },
        cafePlus: {
          food:     { today: r2(todayPos.cafeFood),  mtd: r2(mtdPos.cafeFood),  ytd: r2(ytdPos.cafeFood) },
          beverage: { today: 0, mtd: 0, ytd: 0 },
          discount: { today: r2(todayPos.cafeDisc),  mtd: r2(mtdPos.cafeDisc),  ytd: r2(ytdPos.cafeDisc) },
          total:    { today: r2(todayPos.cafeTotal), mtd: r2(mtdPos.cafeTotal), ytd: r2(ytdPos.cafeTotal) },
        },
        banquet: { total: { today: r2(todayPos.bqTotal), mtd: r2(mtdPos.bqTotal), ytd: r2(ytdPos.bqTotal) } },
        totalRevenue: { today: totalRev(todayFO, todayPos), mtd: totalRev(mtdFO, mtdPos), ytd: totalRev(ytdFO, ytdPos) },
        miscReceipts: { today: r2(miscToday), mtd: r2(miscMTD), ytd: r2(miscYTD) },
        taxDetail: {
          cgst:  { today: todayTax.cgst, mtd: mtdTax.cgst, ytd: ytdTax.cgst },
          sgst:  { today: todayTax.sgst, mtd: mtdTax.sgst, ytd: ytdTax.sgst },
          total: { today: todayTax.total, mtd: mtdTax.total, ytd: ytdTax.total },
        },
      },
      settlements: {
        totalRevenueToday: r2(totalRev(todayFO, todayPos) + miscToday + todayTax.total),
        totalSettlementsToday: r2(todayPmts.total),
        deposits: {
          cash:         { today: r2(todayPmts.cash),         mtd: r2(mtdPmts.cash),         ytd: r2(ytdPmts.cash) },
          billToCompany:{ today: r2(todayPmts.cityLedger),   mtd: r2(mtdPmts.cityLedger),   ytd: r2(ytdPmts.cityLedger) },
          creditCard:   { today: r2(todayPmts.creditCard),   mtd: r2(mtdPmts.creditCard),   ytd: r2(ytdPmts.creditCard) },
          upi:          { today: r2(todayPmts.upi),          mtd: r2(mtdPmts.upi),          ytd: r2(ytdPmts.upi) },
          bankTransfer: { today: r2(todayPmts.bankTransfer), mtd: r2(mtdPmts.bankTransfer), ytd: r2(ytdPmts.bankTransfer) },
          total:        { today: r2(todayPmts.total),        mtd: r2(mtdPmts.total),        ytd: r2(ytdPmts.total) },
        },
      },
      occupancy: {
        totalRooms, occupiedRooms, vacantRooms, occupancyPct,
        complementary: compRooms, paidOccupied: occupiedRooms - compRooms, pax,
        roomTypeADR: rtMap,
        today:  { adr: todayADR, checkedIn: todayCI, checkedOut: todayCO, nights: occupiedRooms },
        mtd:    { adr: mtdADR,   checkedIn: mtdCI,   checkedOut: mtdCO,   nights: mtdNights },
        ytd:    { adr: ytdADR,   checkedIn: ytdCI,   checkedOut: ytdCO,   nights: ytdNights },
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
