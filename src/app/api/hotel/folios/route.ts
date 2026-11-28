import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const folioId = searchParams.get('folioId');
    const roomId = searchParams.get('roomId');
    const reservationId = searchParams.get('reservationId');
    const propertyIdParam = searchParams.get('propertyId');

    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          guest: true,
          roomType: true,
          rooms: { include: { room: true } },
          folios: {
            include: {
              transactions: {
                orderBy: { txnDate: 'desc' }
              },
              posOrders: {
                orderBy: { createdAt: 'desc' },
                include: {
                  outlet: { select: { name: true, type: true } },
                  items: {
                    include: {
                      product: { select: { name: true, isVeg: true } }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!reservation) {
        return apiError(new Error('Reservation not found'), 404);
      }

      // Also find all POS orders related to this reservation's room or guest
      const assignedRoomId = reservation.assignedRoomId || reservation.rooms?.[0]?.roomId;
      const roomNumber = reservation.rooms?.[0]?.room?.roomNumber;
      const folioIds = reservation.folios.map(f => f.id);

      const additionalOrders = await prisma.posOrder.findMany({
        where: {
          OR: [
            ...(folioIds.length > 0 ? [{ folioId: { in: folioIds } }] : []),
            ...(assignedRoomId ? [{ roomId: assignedRoomId }] : []),
            ...(roomNumber ? [{ tableNo: `Room ${roomNumber}` }, { tableNo: roomNumber }] : []),
            ...(reservation.guestId ? [{ guestId: reservation.guestId, createdAt: { gte: reservation.arrivalDate } }] : [])
          ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
          outlet: { select: { name: true, type: true } },
          items: {
            include: {
              product: { select: { name: true, isVeg: true } }
            }
          }
        }
      });

      // Combine orders without duplicates
      const orderMap = new Map();
      reservation.folios.forEach(f => {
        f.posOrders.forEach((o: any) => orderMap.set(o.id, o));
      });
      additionalOrders.forEach(o => orderMap.set(o.id, o));
      const allOrders = Array.from(orderMap.values());

      // Collect all transactions from all folios
      const allTransactions = reservation.folios.flatMap(f => f.transactions);

      // Total restaurant / F&B spend
      const totalRestaurantBill = allOrders.reduce((sum, o: any) => sum + (Number(o.grandTotal) || 0), 0);
      const totalRoomCharges = allTransactions
        .filter(t => t.sourceModule !== 'PAYMENT')
        .reduce((sum, t) => sum + (Number(t.debitAmount) || 0), 0);

      return apiResponse({
        reservation,
        folios: reservation.folios,
        orders: allOrders,
        transactions: allTransactions,
        summary: {
          totalRestaurantBill,
          totalRoomCharges,
          totalOrdersCount: allOrders.length,
          grandTotalWithFood: (reservation.totalAmount || 0) + totalRestaurantBill
        }
      });
    }

    if (folioId) {
      const folio = await prisma.folio.findUnique({
        where: { id: folioId },
        include: {
          guest: true,
          reservation: {
            include: {
              roomType: true,
              rooms: { include: { room: true } },
              checkIns: { include: { room: true } },
              property: true,
            },
          },
          transactions: {
            orderBy: { txnDate: 'asc' },
          },
          posOrders: {
            orderBy: { createdAt: 'desc' },
            include: {
              outlet: { select: { name: true, type: true } },
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!folio) {
        return apiError(new Error('Folio not found'), 404);
      }

      // Fetch any unlinked POS Orders for this room or guest during their stay
      const roomNumber =
        folio.reservation?.rooms?.[0]?.room?.roomNumber ||
        (folio.reservation as any)?.checkIns?.[0]?.room?.roomNumber ||
        (folio.reservation as any)?.checkIns?.[0]?.roomNumber;
      const assignedRoomId =
        folio.reservation?.rooms?.[0]?.roomId ||
        (folio.reservation as any)?.assignedRoomId ||
        (folio.reservation as any)?.checkIns?.[0]?.roomId;
      const arrival = folio.reservation?.arrivalDate ? new Date(folio.reservation.arrivalDate) : undefined;
      const propertyId = folio.reservation?.propertyId;

      const existingPosIds = folio.posOrders.map((o) => o.id);
      let additionalPosOrders: any[] = [];
      if (propertyId) {
        additionalPosOrders = await prisma.posOrder.findMany({
          where: {
            propertyId,
            ...(existingPosIds.length > 0 ? { NOT: { id: { in: existingPosIds } } } : {}),
            OR: [
              ...(roomNumber ? [{ tableNo: `Room ${roomNumber}` }, { tableNo: String(roomNumber) }] : []),
              ...(assignedRoomId ? [{ roomId: assignedRoomId }] : []),
              ...(folio.guestId ? [{ guestId: folio.guestId, ...(arrival ? { createdAt: { gte: arrival } } : {}) }] : []),
            ],
          },
          include: {
            outlet: { select: { name: true, type: true } },
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      // Fetch Spa Bookings for this folio, reservation or guest
      const spaBookings = await prisma.spaBooking.findMany({
        where: {
          OR: [
            { folioId: folio.id },
            ...(folio.reservationId ? [{ reservationId: folio.reservationId }] : []),
            ...(folio.guestId ? [{ guestId: folio.guestId, ...(arrival ? { createdAt: { gte: arrival } } : {}) }] : []),
          ],
        },
        include: {
          service: true,
          spa: { select: { name: true } },
          therapist: { select: { name: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      });

      // Fetch Laundry Requests for this room
      const laundryRequests = (propertyId && roomNumber) ? await prisma.laundryRequest.findMany({
        where: {
          propertyId,
          roomNumber: String(roomNumber),
          ...(arrival ? { createdAt: { gte: arrival } } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }) : [];

      const combinedPosOrders = [...folio.posOrders, ...additionalPosOrders];

      // Reconcile POS Orders with folio transactions
      const existingPosTxns = folio.transactions.filter(
        (t) => t.debitAmount > 0 && (t.sourceModule === 'POS' || t.sourceModule === 'ROOM_SERVICE')
      );

      // Identify any orders not yet recorded as a debit transaction
      const unpostedOrders = combinedPosOrders.filter((o) => {
        return !existingPosTxns.some(
          (t) => t.sourceRefId === o.id || (o.orderNo && t.description?.includes(o.orderNo))
        );
      });

      const unpostedPosTotal = unpostedOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

      const virtualPosTxns = unpostedOrders.map((o) => ({
        id: `pos-${o.id}`,
        folioId: folio.id,
        txnType: 'DEBIT' as const,
        sourceModule: o.tableNo?.toLowerCase().includes('room') ? 'ROOM_SERVICE' : 'POS',
        sourceRefId: o.id,
        description: `${o.outlet?.name || 'Restaurant'} — Order #${o.orderNo}`,
        debitAmount: Number(o.grandTotal) || 0,
        creditAmount: 0,
        taxAmount: Number(o.taxAmount) || 0,
        netAmount: Number(o.grandTotal) || 0,
        txnDate: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      }));

      // Check if there is any HMS Room Rent debit transaction
      const existingHmsDebits = folio.transactions.filter(
        (t) => t.debitAmount > 0 && !['POS', 'ROOM_SERVICE', 'PAYMENT'].includes(t.sourceModule || '')
      );
      const hmsDebitTotal = existingHmsDebits.reduce((sum, t) => sum + (Number(t.debitAmount) || 0), 0);

      // If no HMS debit exists, derive Room Rent from reservation.totalAmount or room rate * nights
      const resObj = folio.reservation as any;
      const arrDate = resObj?.arrivalDate;
      const depDate = resObj?.departureDate;
      const nights = arrDate && depDate
        ? Math.max(1, Math.round((new Date(depDate).getTime() - new Date(arrDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
      const rawResTotal = Number(resObj?.totalAmount || 0);
      const fallbackRate = Number(resObj?.rooms?.[0]?.ratePerNight || resObj?.roomType?.baseRate || 0);
      const reservationTotal = rawResTotal > 0
        ? rawResTotal
        : (!resObj?.isOwnerGuest && fallbackRate > 0 ? fallbackRate * nights : 0);

      let virtualRoomRentTxn: any[] = [];
      let virtualRoomRentTotal = 0;

      if (hmsDebitTotal === 0 && reservationTotal > 0) {
        const rn =
          resObj?.rooms?.[0]?.room?.roomNumber ||
          resObj?.checkIns?.[0]?.room?.roomNumber ||
          'Room';
        virtualRoomRentTotal = reservationTotal;
        virtualRoomRentTxn = [{
          id: `virtual-room-rent-${folio.id}`,
          folioId: folio.id,
          txnType: 'DEBIT' as const,
          sourceModule: 'HMS',
          sourceRefId: folio.reservationId,
          description: `Room Rent — ${rn} (${nights} Night${nights !== 1 ? 's' : ''})`,
          debitAmount: reservationTotal,
          creditAmount: 0,
          taxAmount: 0,
          netAmount: reservationTotal,
          txnDate: arrDate ? new Date(arrDate).toISOString() : new Date().toISOString(),
        }];
      }

      // If folio.totalCharges in DB is 0 but reservation has totalAmount, use reservation total as base
      const baseCharges = (folio.totalCharges || 0) > 0
        ? (folio.totalCharges || 0)
        : virtualRoomRentTotal;

      const allTransactions = [...virtualRoomRentTxn, ...folio.transactions, ...virtualPosTxns];
      const recalculatedTotalCharges = baseCharges + unpostedPosTotal;
      const recalculatedClosingBalance = Math.max(0, recalculatedTotalCharges - (folio.totalPayments || 0));

      const enrichedFolio = {
        ...folio,
        totalCharges: recalculatedTotalCharges,
        closingBalance: recalculatedClosingBalance,
        transactions: allTransactions,
        posOrders: combinedPosOrders,
        spaBookings,
        laundryRequests,
      };

      return apiResponse(enrichedFolio);
    }

    if (roomId) {
      // Find the active folio for this room
      // To find it, we lookup an active CheckIn for the room
      const activeCheckIn = await prisma.checkIn.findFirst({
        where: {
          roomId,
          status: 'ACTIVE',
        },
        include: {
          reservation: {
            include: {
              folios: {
                where: { status: 'OPEN' },
                include: {
                  guest: true,
                  transactions: {
                    orderBy: { txnDate: 'desc' }
                  }
                }
              }
            }
          }
        }
      });

      const activeFolio = activeCheckIn?.reservation?.folios?.[0] || null;
      return apiResponse(activeFolio);
    }

    // Default: list all open folios for property
    const propertyWhere = getMultiTenantWhere(session, propertyIdParam);
    const openFolios = await prisma.folio.findMany({
      where: {
        status: 'OPEN',
        reservation: propertyWhere,
      },
      include: {
        guest: true,
        reservation: {
          include: {
            rooms: {
              include: {
                room: true,
              }
            },
            checkIns: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy: { folioNo: 'asc' },
    });

    return apiResponse(openFolios);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { folioId, txnType, description, amount, sourceModule = 'HMS', taxAmount = 0 } = body;

    if (!folioId || !txnType || !description || amount === undefined) {
      return apiError(new Error('Folio ID, Transaction Type, Description, and Amount are required.'), 400);
    }

    const value = Number(amount);
    const tax = Number(taxAmount);
    const debit = txnType === 'DEBIT' ? value : 0;
    const credit = txnType === 'CREDIT' ? value : 0;
    // For debits, netAmount is positive. For credits, netAmount is negative.
    const net = debit - credit;

    const folio = await prisma.folio.findUnique({
      where: { id: folioId }
    });

    if (!folio) {
      return apiError(new Error('Folio not found.'), 404);
    }

    // Create folio transaction
    const transaction = await prisma.folioTransaction.create({
      data: {
        folioId,
        txnType,
        sourceModule,
        description,
        debitAmount: debit,
        creditAmount: credit,
        taxAmount: tax,
        netAmount: net,
      }
    });

    // Update Folio balances
    const newTotalCharges = folio.totalCharges + debit;
    const newTotalPayments = folio.totalPayments + credit;
    const newClosingBalance = newTotalCharges - newTotalPayments;

    const updatedFolio = await prisma.folio.update({
      where: { id: folioId },
      data: {
        totalCharges: newTotalCharges,
        totalPayments: newTotalPayments,
        closingBalance: newClosingBalance,
      },
      include: {
        transactions: {
          orderBy: { txnDate: 'desc' }
        }
      }
    });

    return apiResponse({ transaction, folio: updatedFolio }, 'Transaction posted successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { folioId, guestId, reservationId, gstNumber, companyName, billingAddress } = body;

    if (!folioId && !guestId && !reservationId) {
      return apiError(new Error('folioId or guestId or reservationId is required'), 400);
    }

    let targetGuestId = guestId;
    let targetReservationId = reservationId;

    if (folioId) {
      const folio = await prisma.folio.findUnique({ where: { id: folioId } });
      if (folio) {
        targetGuestId = targetGuestId || folio.guestId;
        targetReservationId = targetReservationId || folio.reservationId;
      }
    }

    if (targetGuestId) {
      await prisma.guest.update({
        where: { id: targetGuestId },
        data: {
          gstNumber: gstNumber ?? undefined,
          companyName: companyName ?? undefined,
          billingAddress: billingAddress ?? undefined,
        }
      });
    }

    if (targetReservationId) {
      await prisma.reservation.update({
        where: { id: targetReservationId },
        data: {
          gstNumber: gstNumber ?? undefined,
          companyName: companyName ?? undefined,
          billingAddress: billingAddress ?? undefined,
        }
      });
    }

    return apiResponse({ success: true }, 'GST details updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const folioId = searchParams.get('folioId');
    const transactionId = searchParams.get('transactionId');
    const sourceModule = searchParams.get('sourceModule');

    if (!folioId) return apiError(new Error('folioId is required'), 400);

    const folio = await prisma.folio.findUnique({
      where: { id: folioId },
      include: { transactions: true }
    });
    if (!folio) return apiError(new Error('Folio not found'), 404);

    let txnsToDelete: typeof folio.transactions = [];
    if (transactionId) {
      txnsToDelete = folio.transactions.filter(t => t.id === transactionId);
    } else if (sourceModule) {
      txnsToDelete = folio.transactions.filter(t => t.sourceModule === sourceModule);
    }

    if (txnsToDelete.length === 0) {
      return apiResponse({ deletedCount: 0, folio }, 'No matching transactions found');
    }

    const totalDebitRemoved = txnsToDelete.reduce((s, t) => s + (t.debitAmount || 0), 0);
    const totalCreditRemoved = txnsToDelete.reduce((s, t) => s + (t.creditAmount || 0), 0);

    await prisma.folioTransaction.deleteMany({
      where: { id: { in: txnsToDelete.map(t => t.id) } }
    });

    const newTotalCharges = Math.max(0, folio.totalCharges - totalDebitRemoved);
    const newTotalPayments = Math.max(0, folio.totalPayments - totalCreditRemoved);
    const newClosingBalance = newTotalCharges - newTotalPayments;

    const updatedFolio = await prisma.folio.update({
      where: { id: folioId },
      data: {
        totalCharges: newTotalCharges,
        totalPayments: newTotalPayments,
        closingBalance: newClosingBalance,
      },
      include: {
        transactions: { orderBy: { txnDate: 'desc' } }
      }
    });

    return apiResponse({ deletedCount: txnsToDelete.length, folio: updatedFolio }, 'Transaction(s) removed successfully');
  } catch (error) {
    return apiError(error);
  }
}
