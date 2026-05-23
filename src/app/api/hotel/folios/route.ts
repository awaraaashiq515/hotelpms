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
    const propertyIdParam = searchParams.get('propertyId');

    if (folioId) {
      const folio = await prisma.folio.findUnique({
        where: { id: folioId },
        include: {
          guest: true,
          reservation: {
            include: {
              roomType: true,
              checkIns: {
                where: { status: 'ACTIVE' }
              }
            }
          },
          transactions: {
            orderBy: { txnDate: 'desc' }
          }
        }
      });
      return apiResponse(folio);
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
