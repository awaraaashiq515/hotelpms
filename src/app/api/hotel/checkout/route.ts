import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getNextInvoiceNumber } from '@/lib/hotel/invoice-sequence';
import { computeRoomGst, computeFoodGst } from '@/lib/hotel/gst-service';
import { sendMetaWhatsAppTemplate } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { checkInId, paymentAmount = 0, paymentMode = 'CASH', splitPayment } = body;

    if (!checkInId) {
      return apiError(new Error('Check-In ID is required.'), 400);
    }

    // Get the CheckIn details
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        guest: true,
        reservation: {
          include: {
            folios: {
              where: { status: 'OPEN' }
            }
          }
        },
        room: {
          include: {
            property: true
          }
        },
      }
    });

    if (!checkIn) {
      return apiError(new Error('Active check-in record not found.'), 404);
    }

    const folio = checkIn.reservation?.folios?.[0];
    if (!folio) {
      return apiError(new Error('No open folio found for this check-in.'), 404);
    }

    const finalAmountPaid = Number(paymentAmount);

    // Auto-reconcile: find any completed or pending POS / room service orders for this guest or room not yet linked to folio
    const unlinkedOrders = await prisma.posOrder.findMany({
      where: {
        folioId: null,
        OR: [
          { guestId: checkIn.guestId },
          ...(checkIn.roomId ? [{ roomId: checkIn.roomId }] : []),
        ],
      },
      include: {
        outlet: { select: { name: true } }
      }
    });

    if (unlinkedOrders.length > 0) {
      for (const order of unlinkedOrders) {
        if (order.grandTotal <= 0) continue;
        await prisma.posOrder.update({ where: { id: order.id }, data: { folioId: folio.id } });
        await prisma.folioTransaction.create({
          data: {
            folioId: folio.id,
            txnType: 'DEBIT',
            sourceModule: 'POS',
            sourceRefId: order.id,
            description: `${order.outlet?.name || 'Restaurant'} – Order #${order.orderNo}`,
            debitAmount: order.grandTotal,
            creditAmount: 0,
            taxAmount: order.taxAmount || 0,
            netAmount: order.grandTotal,
          }
        });
      }
    }

    // If a payment was made during checkout, add CREDIT transaction(s) to folio
    if (paymentMode === 'SPLIT' && splitPayment) {
      const cashAmt = Number(splitPayment.cashAmount || 0);
      const onlineAmt = Number(splitPayment.onlineAmount || 0);
      const onlineMethod = splitPayment.onlineMethod || 'Online';

      if (cashAmt > 0) {
        await prisma.folioTransaction.create({
          data: {
            folioId: folio.id,
            txnType: 'CREDIT',
            sourceModule: 'HMS',
            description: `Checkout Settlement (Cash): ₹${cashAmt.toLocaleString('en-IN')}`,
            debitAmount: 0,
            creditAmount: cashAmt,
            netAmount: -cashAmt,
          }
        });
      }

      if (onlineAmt > 0) {
        await prisma.folioTransaction.create({
          data: {
            folioId: folio.id,
            txnType: 'CREDIT',
            sourceModule: 'HMS',
            description: `Checkout Settlement (${onlineMethod}): ₹${onlineAmt.toLocaleString('en-IN')}`,
            debitAmount: 0,
            creditAmount: onlineAmt,
            netAmount: -onlineAmt,
          }
        });
      }
    } else if (finalAmountPaid > 0) {
      await prisma.folioTransaction.create({
        data: {
          folioId: folio.id,
          txnType: 'CREDIT',
          sourceModule: 'HMS',
          description: `Checkout Settlement via ${paymentMode}`,
          debitAmount: 0,
          creditAmount: finalAmountPaid,
          netAmount: -finalAmountPaid,
        }
      });
    }

    // Recalculate folio balances before closing
    const freshFolio = await prisma.folio.findUnique({
      where: { id: folio.id },
      include: { transactions: true }
    });

    const totalCharges = freshFolio?.transactions.reduce((sum: number, t: any) => sum + (t.debitAmount || 0), 0) || 0;
    const totalPayments = freshFolio?.transactions.reduce((sum: number, t: any) => sum + (t.creditAmount || 0), 0) || 0;
    const closingBalance = Math.max(0, totalCharges - totalPayments);

    // 1. Close the Folio
    await prisma.folio.update({
      where: { id: folio.id },
      data: {
        totalCharges,
        totalPayments,
        closingBalance,
        status: 'CLOSED',
      }
    });

    // 2. Create the Checkout record
    const checkOut = await prisma.checkOut.create({
      data: {
        checkInId,
        checkedOutAt: new Date(),
        finalBillAmount: totalCharges,
        settlementStatus: closingBalance <= 0 ? 'SETTLED' : 'DUE',
      }
    });

    // 3. Update Check-In Status to COMPLETED
    await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        status: 'COMPLETED'
      }
    });

    // 4. Update Reservation Status to CHECKED_OUT and expire WiFi status
    await prisma.reservation.update({
      where: { id: checkIn.reservationId },
      data: {
        status: 'CHECKED_OUT',
        dueAmount: closingBalance,
        wifiStatus: 'EXPIRED'
      }
    });

    // 5. Release the Room, mark it as Dirty
    await prisma.room.update({
      where: { id: checkIn.roomId },
      data: {
        status: 'AVAILABLE',
        housekeepingStatus: 'DIRTY',
      }
    });

    // Deactivate & expire active Room Portal tokens for this guest and room (WP-0.11 / ROOMP-01)
    await prisma.roomPortalSession.updateMany({
      where: {
        roomId: checkIn.roomId,
        guestId: checkIn.guestId,
        isActive: true,
      },
      data: {
        isActive: false,
        logoutAt: new Date(),
        expiresAt: new Date(),
      },
    });

    // 6. Generate official GST Tax Invoice upon checkout settlement
    const isComplimentary = Boolean(
      checkIn.reservation.waiveBill ||
      checkIn.reservation.isOwnerGuest ||
      checkIn.reservation.ownerBillingType === 'COMPLIMENTARY'
    );

    const propertyId = checkIn.room.propertyId;
    const invoiceNo = await getNextInvoiceNumber(propertyId);

    let subtotal = 0;
    let taxAmount = 0;
    const invoiceItems: any[] = [];

    if (isComplimentary) {
      invoiceItems.push({
        description: `Complimentary / Hosted Stay - Room ${checkIn.room.roomNumber}`,
        qty: 1,
        unitPrice: 0,
        taxAmount: 0,
        totalAmount: 0,
        hsnCode: '996311',
        status: 'COMPLIMENTARY',
      });
    } else {
      // Check if property is specified premises (has room tariff > 7500)
      const maxRoom = await prisma.room.findFirst({
        where: { propertyId },
        orderBy: { customRate: 'desc' },
        include: { roomType: true },
      });
      const highestTariff = Math.max(maxRoom?.customRate || 0, maxRoom?.roomType?.baseRate || 0);
      const isSpecifiedPremises = highestTariff > 7500;

      const debits = freshFolio?.transactions.filter((t: any) => t.txnType === 'DEBIT') || [];
      for (const txn of debits) {
        if (txn.sourceModule === 'POS') {
          const fTax = computeFoodGst(txn.debitAmount, isSpecifiedPremises);
          subtotal += txn.debitAmount;
          taxAmount += fTax.totalTax;
          invoiceItems.push({
            description: txn.description || 'F&B Restaurant / Room Service',
            qty: 1,
            unitPrice: txn.debitAmount,
            taxAmount: fTax.totalTax,
            totalAmount: txn.debitAmount + fTax.totalTax,
            hsnCode: fTax.sacCode,
          });
        } else {
          // Room Accommodation
          const rTax = computeRoomGst(txn.debitAmount, 1, false);
          subtotal += txn.debitAmount;
          taxAmount += rTax.totalTax;
          invoiceItems.push({
            description: txn.description || `Room Accommodation - Room ${checkIn.room.roomNumber}`,
            qty: 1,
            unitPrice: txn.debitAmount,
            taxAmount: rTax.totalTax,
            totalAmount: txn.debitAmount + rTax.totalTax,
            hsnCode: rTax.sacCode,
          });
        }
      }
    }

    const grandTotal = isComplimentary ? 0 : Math.round((subtotal + taxAmount) * 100) / 100;
    const paymentStatus = isComplimentary
      ? 'COMPLIMENTARY'
      : (closingBalance <= 0 ? 'PAID' : 'DUE');

    const invoice = await prisma.invoice.create({
      data: {
        propertyId,
        invoiceNo,
        guestId: checkIn.guestId,
        folioId: folio.id,
        subtotal: isComplimentary ? 0 : subtotal,
        taxAmount: isComplimentary ? 0 : taxAmount,
        totalAmount: grandTotal,
        paymentStatus,
        invoiceStatus: 'SETTLED',
        invoiceDate: new Date(),
        items: {
          create: invoiceItems
        }
      }
    });

    // Send Official WhatsApp Invoice Receipt with Download Button to Guest
    const guestMobile = checkIn.guest?.mobile || '';
    if (guestMobile && guestMobile.replace(/[^0-9]/g, '').length >= 10) {
      try {
        const guestName = `${checkIn.guest?.firstName || ''} ${checkIn.guest?.lastName || ''}`.trim() || 'Guest';
        const hotelName = checkIn.room?.property?.name || 'OrderMint Hotel';
        const dateStr = new Date().toLocaleDateString('en-GB');

        sendMetaWhatsAppTemplate({
          mobile: guestMobile,
          templateName: 'hotel_order_receipt',
          parameters: [
            guestName,
            hotelName,
            invoice.invoiceNo,
            dateStr,
            grandTotal,
          ],
          buttonUrlParameter: invoice.invoiceNo,
          propertyId,
        }).catch((err) => console.error('[Checkout WhatsApp Invoice BG Error]:', err));
      } catch (waErr) {
        console.error('[Checkout WhatsApp Error]:', waErr);
      }
    }

    return apiResponse({ checkOut, closingBalance, invoice }, 'Guest checked out successfully and Tax Invoice generated');
  } catch (error) {
    console.error('Checkout error:', error);
    return apiError(error);
  }
}
