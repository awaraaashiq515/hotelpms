import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const type = searchParams.get('type'); // 'ALL' | 'B2B' | 'B2C'
    const statusParam = searchParams.get('status'); // 'ALL' | 'PAID' | 'PARTIAL' | 'DUE' | 'COMPLIMENTARY' | 'PROFORMA'
    const search = searchParams.get('search')?.trim().toLowerCase();
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startBound = startDateParam ? new Date(`${startDateParam}T00:00:00.000`) : null;
    const endBound = endDateParam ? new Date(`${endDateParam}T23:59:59.999`) : null;
    const isWithinDateRange = (dateInput: string | Date | null | undefined) => {
      if (!startBound && !endBound) return true;
      if (!dateInput) return false;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return false;
      if (startBound && d < startBound) return false;
      if (endBound && d > endBound) return false;
      return true;
    };

    const propertyWhere = getMultiTenantWhere(session, propertyIdParam);

    // 1. Fetch Official Settled Invoices from DB
    const dbInvoices = await prisma.invoice.findMany({
      where: {
        ...propertyWhere,
      },
      include: {
        property: true,
        guest: true,
        folio: {
          include: {
            guest: true,
            reservation: {
              include: {
                property: true,
                roomType: true,
                rooms: { include: { room: true } },
                checkIns: { include: { room: true } },
              }
            },
            transactions: true,
          }
        },
        items: true,
      },
      orderBy: { invoiceDate: 'desc' }
    });

    // 2. Fetch Active Open Folios (In-house guests who have NOT checked out yet)
    // These are labeled strictly as PROFORMA / ESTIMATES (H7)
    const openFolios = await prisma.folio.findMany({
      where: {
        status: 'OPEN',
        reservation: propertyWhere,
      },
      include: {
        guest: true,
        reservation: {
          include: {
            property: true,
            roomType: true,
            rooms: { include: { room: true } },
            checkIns: { include: { room: true } },
          }
        },
        transactions: true,
      },
      orderBy: { folioNo: 'desc' }
    });

    // Format DB Invoices
    const formattedSettledInvoices = dbInvoices.map((inv) => {
      const reservation = inv.folio?.reservation;
      const guest = inv.guest || inv.folio?.guest;
      const items = inv.items || [];

      const gstNumber = (reservation?.gstNumber || guest?.gstNumber || '').trim().toUpperCase();
      const companyName = (reservation?.companyName || guest?.companyName || '').trim();
      const isB2B = Boolean(gstNumber || companyName);

      const isComplimentary = inv.paymentStatus === 'COMPLIMENTARY' || Boolean(reservation?.waiveBill || reservation?.isOwnerGuest);

      const totalTax = isComplimentary ? 0 : (inv.taxAmount || items.reduce((s, it) => s + (it.taxAmount || 0), 0));
      const cgst = Math.round((totalTax / 2) * 100) / 100;
      const sgst = Math.round((totalTax / 2) * 100) / 100;

      const taxableAmount = isComplimentary ? 0 : (inv.subtotal || Math.max(0, inv.totalAmount - totalTax));
      const totalAmount = isComplimentary ? 0 : inv.totalAmount;

      const creditTransactions = inv.folio?.transactions.filter((t) => t.txnType === 'CREDIT' || t.creditAmount > 0) || [];
      let cashPaid = 0;
      let onlinePaid = 0;
      creditTransactions.forEach((t) => {
        const desc = (t.description || '').toUpperCase();
        if (desc.includes('CASH')) cashPaid += t.creditAmount;
        else onlinePaid += t.creditAmount;
      });

      const room = reservation?.rooms?.[0]?.room;

      return {
        id: inv.id,
        folioId: inv.folioId || inv.id,
        invoiceNo: inv.invoiceNo,
        folioNo: inv.folio?.folioNo || 'FOLIO-SETTLED',
        bookingNo: reservation?.bookingNo || '—',
        invoiceDate: inv.invoiceDate.toISOString(),
        guestId: guest?.id,
        guestName: `${guest?.firstName || ''} ${guest?.lastName || ''}`.trim() || 'Guest Customer',
        guestMobile: guest?.mobile || '—',
        guestEmail: guest?.email || '—',
        roomNumber: room?.roomNumber || '—',
        roomTypeName: reservation?.roomType?.name || 'Standard',
        arrivalDate: reservation?.arrivalDate || inv.invoiceDate,
        departureDate: reservation?.departureDate || inv.invoiceDate,
        isB2B,
        companyName: companyName || null,
        gstNumber: gstNumber || null,
        billingAddress: reservation?.billingAddress || guest?.billingAddress || guest?.address || null,
        taxableAmount,
        cgst,
        sgst,
        totalTax,
        subtotal: taxableAmount,
        totalAmount,
        totalPaid: isComplimentary ? 0 : (cashPaid + onlinePaid),
        dueBalance: isComplimentary ? 0 : Math.max(0, totalAmount - (cashPaid + onlinePaid)),
        paymentStatus: inv.paymentStatus,
        paymentMode: cashPaid > 0 && onlinePaid > 0 ? 'SPLIT' : cashPaid > 0 ? 'CASH' : onlinePaid > 0 ? 'ONLINE' : 'UNPAID',
        cashPaid: isComplimentary ? 0 : cashPaid,
        onlinePaid: isComplimentary ? 0 : onlinePaid,
        invoiceCategory: isB2B ? 'B2B_GST_SETTLED' : 'B2C_RETAIL_SETTLED',
        folioStatus: 'CLOSED',
        isProforma: false,
        isComplimentary,
        rawFolio: inv.folio ? {
          ...inv.folio,
          guest: inv.folio.guest || guest,
          reservation: inv.folio.reservation ? {
            ...inv.folio.reservation,
            property: inv.folio.reservation.property || inv.property,
          } : null,
        } : null,
      };
    });

    // Format Open Folios as PROFORMA / INTERIM BILLS (H7)
    const formattedOpenFolios = openFolios.map((folio) => {
      const reservation = folio.reservation;
      const guest = folio.guest;
      const isComplimentary = Boolean(reservation?.waiveBill || reservation?.isOwnerGuest);

      const gstNumber = (reservation?.gstNumber || guest?.gstNumber || '').trim().toUpperCase();
      const companyName = (reservation?.companyName || guest?.companyName || '').trim();
      const isB2B = Boolean(gstNumber || companyName);

      const debitTransactions = folio.transactions.filter((t) => t.txnType === 'DEBIT') || [];
      const creditTransactions = folio.transactions.filter((t) => t.txnType === 'CREDIT') || [];

      const totalCharges = isComplimentary ? 0 : debitTransactions.reduce((s, t) => s + (t.debitAmount || 0), 0);
      const totalPaid = isComplimentary ? 0 : creditTransactions.reduce((s, t) => s + (t.creditAmount || 0), 0);
      const dueBalance = isComplimentary ? 0 : Math.max(0, totalCharges - totalPaid);

      const totalTax = isComplimentary ? 0 : debitTransactions.reduce((s, t) => s + (t.taxAmount || 0), 0);
      const cgst = Math.round((totalTax / 2) * 100) / 100;
      const sgst = Math.round((totalTax / 2) * 100) / 100;
      const taxableAmount = Math.max(0, totalCharges - totalTax);

      const room = reservation?.rooms?.[0]?.room;

      return {
        id: folio.id,
        folioId: folio.id,
        invoiceNo: `PROFORMA-${folio.folioNo}`,
        folioNo: folio.folioNo,
        bookingNo: reservation?.bookingNo || '—',
        invoiceDate: reservation?.arrivalDate || new Date().toISOString(),
        guestId: guest?.id,
        guestName: `${guest?.firstName || ''} ${guest?.lastName || ''}`.trim() || 'In-House Guest',
        guestMobile: guest?.mobile || '—',
        guestEmail: guest?.email || '—',
        roomNumber: room?.roomNumber || '—',
        roomTypeName: reservation?.roomType?.name || 'Standard',
        arrivalDate: reservation?.arrivalDate,
        departureDate: reservation?.departureDate,
        isB2B,
        companyName: companyName || null,
        gstNumber: gstNumber || null,
        billingAddress: reservation?.billingAddress || guest?.billingAddress || guest?.address || null,
        taxableAmount,
        cgst,
        sgst,
        totalTax,
        subtotal: taxableAmount,
        totalAmount: totalCharges,
        totalPaid,
        dueBalance,
        paymentStatus: isComplimentary ? 'COMPLIMENTARY' : 'PROFORMA',
        paymentMode: totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
        cashPaid: 0,
        onlinePaid: totalPaid,
        invoiceCategory: 'PROFORMA_INTERIM_BILL',
        folioStatus: 'OPEN',
        isProforma: true,
        isComplimentary,
        rawFolio: folio,
      };
    });

    const dateFilteredSettled = formattedSettledInvoices.filter((i) => isWithinDateRange(i.invoiceDate));
    const dateFilteredOpen = formattedOpenFolios.filter((i) => isWithinDateRange(i.invoiceDate));

    const allInvoices = [...dateFilteredSettled, ...dateFilteredOpen];

    // Filter by type
    let filtered = allInvoices;
    if (type === 'B2B') filtered = filtered.filter((i) => i.isB2B);
    if (type === 'B2C') filtered = filtered.filter((i) => !i.isB2B);

    if (statusParam && statusParam !== 'ALL') {
      filtered = filtered.filter((i) => i.paymentStatus === statusParam);
    }

    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.guestName.toLowerCase().includes(search) ||
          i.invoiceNo.toLowerCase().includes(search) ||
          i.folioNo.toLowerCase().includes(search) ||
          i.bookingNo.toLowerCase().includes(search)
      );
    }

    // Revenue KPIs strictly exclude complimentary / waived stays! (C5)
    const paidSettledInvoices = dateFilteredSettled.filter((i) => !i.isComplimentary);
    const totalInvoiced = paidSettledInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalTaxCollected = paidSettledInvoices.reduce((sum, inv) => sum + inv.totalTax, 0);
    const totalCgstCollected = paidSettledInvoices.reduce((sum, inv) => sum + inv.cgst, 0);
    const totalSgstCollected = paidSettledInvoices.reduce((sum, inv) => sum + inv.sgst, 0);

    const b2bInvoices = paidSettledInvoices.filter((inv) => inv.isB2B);
    const b2cInvoices = paidSettledInvoices.filter((inv) => !inv.isB2B);

    const summary = {
      totalInvoiced,
      totalInvoicesCount: paidSettledInvoices.length,
      totalTaxCollected,
      totalCgstCollected,
      totalSgstCollected,
      complimentaryStaysCount: allInvoices.filter((i) => i.isComplimentary).length,
      proformaCount: dateFilteredOpen.length,
      b2b: {
        count: b2bInvoices.length,
        totalAmount: b2bInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        cashPaid: b2bInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0),
        onlinePaid: b2bInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0),
      },
      b2c: {
        count: b2cInvoices.length,
        totalAmount: b2cInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        cashPaid: b2cInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0),
        onlinePaid: b2cInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0),
      },
      cash: {
        total: paidSettledInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0),
        onGstInvoices: b2bInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0),
        onSimpleInvoices: b2cInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0),
      },
      online: {
        total: paidSettledInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0),
        onGstInvoices: b2bInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0),
        onSimpleInvoices: b2cInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0),
      },
      due: {
        totalDueBalance: allInvoices.reduce((sum, inv) => sum + inv.dueBalance, 0),
      },
      dueBalance: allInvoices.reduce((sum, inv) => sum + inv.dueBalance, 0),
    };

    return apiResponse({
      invoices: filtered,
      summary,
    });
  } catch (error) {
    console.error('Invoices API error:', error);
    return apiError(error);
  }
}
