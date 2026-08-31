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
    const paymentModeParam = searchParams.get('paymentMode'); // 'ALL' | 'CASH' | 'ONLINE' | 'BANK_TRANSFER' | 'UNPAID'
    const statusParam = searchParams.get('status'); // 'ALL' | 'PAID' | 'PARTIAL' | 'DUE'
    const search = searchParams.get('search')?.trim().toLowerCase();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const propertyWhere = getMultiTenantWhere(session, propertyIdParam);

    // Fetch all folios for this property
    const folios = await prisma.folio.findMany({
      where: {
        reservation: propertyWhere,
      },
      include: {
        guest: true,
        reservation: {
          include: {
            roomType: true,
            rooms: { include: { room: true } },
            checkIns: {
              orderBy: { checkedInAt: 'desc' },
              take: 1,
            },
            property: true,
          },
        },
        transactions: {
          orderBy: { txnDate: 'desc' },
        },
        posOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            outlet: { select: { name: true, type: true } },
            items: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { folioNo: 'desc' },
    });

    // Map and enrich each folio into a standardized Hotel Invoice Record
    const mappedInvoices = folios.map((folio, idx) => {
      const reservation = folio.reservation;
      const guest = folio.guest;
      const transactions = folio.transactions || [];

      // Uniform sequential invoice numbering: INV-431298-1, INV-431298-2, INV-431298-3...
      const invoiceNo = `INV-431298-${idx + 1}`;

      // 1. Identify B2B vs B2C
      const gstNumber = (reservation?.gstNumber || guest?.gstNumber || '').trim().toUpperCase();
      const companyName = (reservation?.companyName || guest?.companyName || '').trim();
      const billingAddress = (reservation?.billingAddress || guest?.billingAddress || guest?.address || '').trim();
      const isB2B = Boolean(gstNumber || companyName);

      // 2. Compute Tax Breakdown (GST debits)
      const gstTransactions = transactions.filter(
        (t) => t.sourceModule === 'GST' || t.taxAmount > 0 || (t.description && t.description.toLowerCase().includes('gst'))
      );
      const totalTax = gstTransactions.reduce((sum, t) => sum + (t.debitAmount || t.taxAmount || 0), 0);
      const totalDebitCharges = transactions.reduce((sum, t) => sum + (t.debitAmount || 0), 0) || folio.totalCharges;
      const totalPaid = transactions.reduce((sum, t) => sum + (t.creditAmount || 0), 0) || folio.totalPayments;
      const taxableAmount = Math.max(0, totalDebitCharges - totalTax);
      const cgst = Math.round((totalTax / 2) * 100) / 100;
      const sgst = Math.round((totalTax / 2) * 100) / 100;

      // 3. Payment Mode & Settlements breakdown
      const creditTransactions = transactions.filter((t) => t.txnType === 'CREDIT' || t.creditAmount > 0);
      const detectedModes: string[] = [];
      let cashPaid = 0;
      let onlinePaid = 0;
      let bankTransferPaid = 0;

      creditTransactions.forEach((txn) => {
        const desc = (txn.description || '').toUpperCase();
        if (desc.includes('CASH')) {
          detectedModes.push('CASH');
          cashPaid += txn.creditAmount;
        } else if (desc.includes('UPI')) {
          detectedModes.push('UPI');
          onlinePaid += txn.creditAmount;
        } else if (desc.includes('CARD')) {
          detectedModes.push('CARD');
          onlinePaid += txn.creditAmount;
        } else if (desc.includes('BANK_TRANSFER') || desc.includes('BANK TRANSFER') || desc.includes('NEFT') || desc.includes('RTGS')) {
          detectedModes.push('BANK_TRANSFER');
          bankTransferPaid += txn.creditAmount;
        } else if (desc.includes('ONLINE')) {
          detectedModes.push('ONLINE');
          onlinePaid += txn.creditAmount;
        } else {
          // Default fallback
          detectedModes.push('CASH');
          cashPaid += txn.creditAmount;
        }
      });

      const uniqueModes = Array.from(new Set(detectedModes));
      let primaryPaymentMode: 'CASH' | 'ONLINE' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'SPLIT' | 'UNPAID' = 'UNPAID';

      if (totalPaid <= 0) {
        primaryPaymentMode = 'UNPAID';
      } else if (uniqueModes.length > 1) {
        primaryPaymentMode = 'SPLIT';
      } else if (uniqueModes.length === 1) {
        primaryPaymentMode = uniqueModes[0] as any;
      } else {
        primaryPaymentMode = 'CASH';
      }

      // Balance & Payment Status
      const dueBalance = Math.max(0, totalDebitCharges - totalPaid);
      let paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' = 'DUE';
      if (dueBalance <= 0 && totalDebitCharges > 0) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0 && dueBalance > 0) {
        paymentStatus = 'PARTIAL';
      } else if (totalDebitCharges === 0 && totalPaid === 0) {
        paymentStatus = 'PAID';
      }

      // 4. Exact Category Classification
      let invoiceCategory: 'B2B_GST_CASH' | 'B2B_GST_ONLINE' | 'B2B_GST_SPLIT' | 'B2C_RETAIL_CASH' | 'B2C_RETAIL_ONLINE' | 'B2C_RETAIL_SPLIT' | 'UNPAID_DUE' = 'UNPAID_DUE';
      
      if (paymentStatus === 'DUE' && totalPaid === 0) {
        invoiceCategory = 'UNPAID_DUE';
      } else if (isB2B) {
        if (cashPaid > 0 && onlinePaid === 0 && bankTransferPaid === 0) {
          invoiceCategory = 'B2B_GST_CASH';
        } else if (cashPaid === 0 && (onlinePaid > 0 || bankTransferPaid > 0)) {
          invoiceCategory = 'B2B_GST_ONLINE';
        } else {
          invoiceCategory = 'B2B_GST_SPLIT';
        }
      } else {
        if (cashPaid > 0 && onlinePaid === 0 && bankTransferPaid === 0) {
          invoiceCategory = 'B2C_RETAIL_CASH';
        } else if (cashPaid === 0 && (onlinePaid > 0 || bankTransferPaid > 0)) {
          invoiceCategory = 'B2C_RETAIL_ONLINE';
        } else {
          invoiceCategory = 'B2C_RETAIL_SPLIT';
        }
      }

      const activeCheckIn = reservation?.checkIns?.[0];
      const room = reservation?.rooms?.[0]?.room;
      const invoiceDate = activeCheckIn?.checkedInAt || reservation?.arrivalDate || new Date().toISOString();

      return {
        id: folio.id,
        folioId: folio.id,
        invoiceNo,
        folioNo: folio.folioNo,
        bookingNo: reservation?.bookingNo || '—',
        invoiceDate,
        guestId: guest?.id,
        guestName: `${guest?.firstName || ''} ${guest?.lastName || ''}`.trim() || 'Walk-in Guest',
        guestMobile: guest?.mobile || '—',
        guestEmail: guest?.email || '—',
        roomNumber: room?.roomNumber || '—',
        roomTypeName: reservation?.roomType?.name || 'Standard',
        arrivalDate: reservation?.arrivalDate || invoiceDate,
        departureDate: reservation?.departureDate || invoiceDate,
        isB2B,
        companyName: companyName || null,
        gstNumber: gstNumber || null,
        billingAddress: billingAddress || null,
        taxableAmount,
        cgst,
        sgst,
        totalTax,
        subtotal: taxableAmount,
        totalAmount: totalDebitCharges,
        totalPaid,
        dueBalance,
        paymentStatus,
        paymentMode: primaryPaymentMode,
        paymentModesList: uniqueModes,
        cashPaid,
        onlinePaid: onlinePaid + bankTransferPaid,
        invoiceCategory,
        folioStatus: folio.status,
        rawFolio: folio,
      };
    });

    // ── Global KPI Calculations (Across all invoices of property) ─────────────
    const totalInvoiced = mappedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalTaxCollected = mappedInvoices.reduce((sum, inv) => sum + inv.totalTax, 0);
    const totalCgstCollected = mappedInvoices.reduce((sum, inv) => sum + inv.cgst, 0);
    const totalSgstCollected = mappedInvoices.reduce((sum, inv) => sum + inv.sgst, 0);

    const b2bInvoices = mappedInvoices.filter((inv) => inv.isB2B);
    const b2bTotalAmount = b2bInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const b2bTotalCount = b2bInvoices.length;

    const b2cInvoices = mappedInvoices.filter((inv) => !inv.isB2B);
    const b2cTotalAmount = b2cInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const b2cTotalCount = b2cInvoices.length;

    const totalCashCollected = mappedInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0);
    const cashOnGstInvoices = b2bInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0);
    const cashOnSimpleInvoices = b2cInvoices.reduce((sum, inv) => sum + inv.cashPaid, 0);

    const totalOnlineCollected = mappedInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0);
    const onlineOnGstInvoices = b2bInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0);
    const onlineOnSimpleInvoices = b2cInvoices.reduce((sum, inv) => sum + inv.onlinePaid, 0);
    const totalDueBalance = mappedInvoices.reduce((sum, inv) => sum + inv.dueBalance, 0);

    const summary = {
      totalInvoiced,
      totalInvoicesCount: mappedInvoices.length,
      totalTaxCollected,
      totalCgstCollected,
      totalSgstCollected,
      b2b: {
        count: b2bTotalCount,
        totalAmount: b2bTotalAmount,
        cashPaid: cashOnGstInvoices,
        onlinePaid: onlineOnGstInvoices,
      },
      b2c: {
        count: b2cTotalCount,
        totalAmount: b2cTotalAmount,
        cashPaid: cashOnSimpleInvoices,
        onlinePaid: onlineOnSimpleInvoices,
      },
      cash: {
        total: totalCashCollected,
        onGstInvoices: cashOnGstInvoices,
        onSimpleInvoices: cashOnSimpleInvoices,
      },
      online: {
        total: totalOnlineCollected,
        onGstInvoices: onlineOnGstInvoices,
        onSimpleInvoices: onlineOnSimpleInvoices,
      },
      dueBalance: totalDueBalance,
    };

    // ── Apply Query Filters for List Output ────────────────────────────────────
    let filtered = mappedInvoices;

    // Type Filter (B2B vs B2C)
    if (type === 'B2B') {
      filtered = filtered.filter((inv) => inv.isB2B);
    } else if (type === 'B2C') {
      filtered = filtered.filter((inv) => !inv.isB2B);
    }

    // Payment Mode Filter (including specific GST + Payment combinations)
    if (paymentModeParam === 'CASH') {
      filtered = filtered.filter((inv) => inv.cashPaid > 0);
    } else if (paymentModeParam === 'CASH_GST') {
      filtered = filtered.filter((inv) => inv.isB2B && inv.cashPaid > 0);
    } else if (paymentModeParam === 'CASH_SIMPLE') {
      filtered = filtered.filter((inv) => !inv.isB2B && inv.cashPaid > 0);
    } else if (paymentModeParam === 'ONLINE') {
      filtered = filtered.filter((inv) => inv.onlinePaid > 0);
    } else if (paymentModeParam === 'ONLINE_GST') {
      filtered = filtered.filter((inv) => inv.isB2B && inv.onlinePaid > 0);
    } else if (paymentModeParam === 'ONLINE_SIMPLE') {
      filtered = filtered.filter((inv) => !inv.isB2B && inv.onlinePaid > 0);
    } else if (paymentModeParam === 'UNPAID') {
      filtered = filtered.filter((inv) => inv.paymentStatus === 'DUE');
    }

    // Status Filter
    if (statusParam && statusParam !== 'ALL') {
      filtered = filtered.filter((inv) => inv.paymentStatus === statusParam);
    }

    // Date Range Filter
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((inv) => new Date(inv.invoiceDate) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((inv) => new Date(inv.invoiceDate) <= end);
    }

    // Search Query
    if (search) {
      filtered = filtered.filter((inv) => {
        return (
          inv.invoiceNo.toLowerCase().includes(search) ||
          inv.folioNo.toLowerCase().includes(search) ||
          inv.bookingNo.toLowerCase().includes(search) ||
          inv.guestName.toLowerCase().includes(search) ||
          inv.guestMobile.toLowerCase().includes(search) ||
          (inv.companyName && inv.companyName.toLowerCase().includes(search)) ||
          (inv.gstNumber && inv.gstNumber.toLowerCase().includes(search)) ||
          inv.roomNumber.toLowerCase().includes(search)
        );
      });
    }

    return apiResponse({
      invoices: filtered,
      summary,
    });
  } catch (error) {
    return apiError(error);
  }
}
