import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const showGlobal = searchParams.get('global') === 'true' && session.role === 'SUPER_ADMIN';
    const organizationId = session.organizationId;

    if (!showGlobal && !organizationId) {
      return apiError(new Error('Organization context missing from session'), 400);
    }

    const properties = await prisma.property.findMany({
      where: showGlobal ? {} : { organizationId },
      include: {
        _count: { select: { users: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(properties, 'Properties fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { name, code, type, city, state, country, organizationId: targetOrgId, whatsAppEnabled, whatsAppApiKey, whatsAppInstanceId, whatsAppTemplate } = body;

    // Security: Only Super Admin can specify a different organizationId
    const isSuper = session.role === 'SUPER_ADMIN';
    const finalOrgId = (isSuper && targetOrgId) ? targetOrgId : session.organizationId;

    if (!finalOrgId) {
      return apiError(new Error('Organization context missing'), 400);
    }

    if (!name || !code) {
      return apiError(new Error('Missing required fields: name, code'), 400);
    }

    // Check code uniqueness
    const existing = await prisma.property.findUnique({ where: { code } });
    if (existing) {
      return apiError(new Error('Property code already exists'), 400);
    }

    // Create Property and seed default records in a transaction for safety
    const newProperty = await prisma.$transaction(async (tx: any) => {
      // 1. Create Property
      const prop = await tx.property.create({
        data: {
          name,
          code,
          type,
          city,
          state,
          country,
          organizationId: finalOrgId,
          whatsAppEnabled: whatsAppEnabled ?? false,
          whatsAppApiKey,
          whatsAppInstanceId,
          whatsAppTemplate,
        },
      });

      // 2. Create Default Payment Modes
      const paymentModes = [
        { name: 'Cash', type: 'CASH' },
        { name: 'Credit Card', type: 'CARD' },
        { name: 'UPI / QR', type: 'UPI' },
      ];

      for (const mode of paymentModes) {
        await tx.paymentMode.create({
          data: {
            name: mode.name,
            type: mode.type,
            propertyId: prop.id,
            isActive: true,
          },
        });
      }

      // 3. Create/Get Account Group for Cash
      let assetGroup = await tx.accountGroup.findFirst({
        where: { name: 'Cash & Bank', organizationId: finalOrgId },
      });

      if (!assetGroup) {
        assetGroup = await tx.accountGroup.create({
          data: {
            name: 'Cash & Bank',
            nature: 'ASSET',
            organizationId: finalOrgId,
          },
        });
      }

      // 4. Create Cash Account
      await tx.account.create({
        data: {
          id: `cash-${prop.id}`, // Unique ID convention matching seed.ts
          name: 'Cash Account',
          accountType: 'CASH',
          openingBalanceType: 'DEBIT',
          accountGroupId: assetGroup.id,
          propertyId: prop.id,
          organizationId: finalOrgId,
        },
      });

      if (type === 'HOTEL') {
        // Create Default Outlet for Hotel
        await tx.outlet.create({
          data: {
            name: 'Main Hotel Outlet',
            type: 'HOTEL',
            propertyId: prop.id,
          }
        });

        // 1. Seed Room Types
        const deluxeType = await tx.roomType.create({
          data: {
            propertyId: prop.id,
            name: 'Deluxe Room',
            code: 'DELUXE',
            baseRate: 3500.0,
            maxOccupancy: 2,
          }
        });

        const superDeluxeType = await tx.roomType.create({
          data: {
            propertyId: prop.id,
            name: 'Super Deluxe Room',
            code: 'SDELUXE',
            baseRate: 5000.0,
            maxOccupancy: 3,
          }
        });

        const suiteType = await tx.roomType.create({
          data: {
            propertyId: prop.id,
            name: 'Suite Room',
            code: 'SUITE',
            baseRate: 8000.0,
            maxOccupancy: 4,
          }
        });

        // 2. Seed Rooms
        const room101 = await tx.room.create({
          data: {
            propertyId: prop.id,
            roomTypeId: deluxeType.id,
            roomNumber: '101',
            floor: '1',
            status: 'OCCUPIED',
            housekeepingStatus: 'CLEAN',
          }
        });

        const room102 = await tx.room.create({
          data: {
            propertyId: prop.id,
            roomTypeId: deluxeType.id,
            roomNumber: '102',
            floor: '1',
            status: 'AVAILABLE',
            housekeepingStatus: 'CLEAN',
          }
        });

        const room103 = await tx.room.create({
          data: {
            propertyId: prop.id,
            roomTypeId: superDeluxeType.id,
            roomNumber: '103',
            floor: '1',
            status: 'AVAILABLE',
            housekeepingStatus: 'DIRTY',
          }
        });

        const room201 = await tx.room.create({
          data: {
            propertyId: prop.id,
            roomTypeId: deluxeType.id,
            roomNumber: '201',
            floor: '2',
            status: 'AVAILABLE',
            housekeepingStatus: 'CLEAN',
          }
        });

        const room202 = await tx.room.create({
          data: {
            propertyId: prop.id,
            roomTypeId: superDeluxeType.id,
            roomNumber: '202',
            floor: '2',
            status: 'AVAILABLE',
            housekeepingStatus: 'CLEAN',
          }
        });

        const room203 = await tx.room.create({
          data: {
            propertyId: prop.id,
            roomTypeId: suiteType.id,
            roomNumber: '203',
            floor: '2',
            status: 'AVAILABLE',
            housekeepingStatus: 'CLEAN',
          }
        });

        // 3. Seed Guests
        const guest1 = await tx.guest.create({
          data: {
            organizationId: finalOrgId,
            firstName: 'Tarun',
            lastName: 'Sharma',
            mobile: '9876543210',
            email: 'tarun@example.com',
            idType: 'Aadhaar',
            idNumber: '1234-5678-9012',
          }
        });

        const guest2 = await tx.guest.create({
          data: {
            organizationId: finalOrgId,
            firstName: 'Priya',
            lastName: 'Patel',
            mobile: '9876543211',
            email: 'priya@example.com',
            idType: 'Passport',
            idNumber: 'Z1234567',
          }
        });

        // 4. Seed Reservations & Check-Ins
        const today = new Date();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        // Reservation 1 (Checked-In, Expected Departure Today)
        const res1 = await tx.reservation.create({
          data: {
            propertyId: prop.id,
            guestId: guest1.id,
            bookingNo: `RES-${Date.now().toString().slice(-6)}-101`,
            arrivalDate: yesterday,
            departureDate: today,
            adults: 2,
            children: 0,
            roomTypeId: deluxeType.id,
            assignedRoomId: room101.id,
            status: 'CHECKED_IN',
            totalAmount: 3500.0,
            advanceAmount: 1000.0,
            dueAmount: 2500.0,
            rooms: {
              create: {
                roomId: room101.id,
                ratePerNight: 3500.0,
                adults: 2,
                children: 0,
              }
            }
          }
        });

        // Create CheckIn record for Reservation 1
        await tx.checkIn.create({
          data: {
            reservationId: res1.id,
            guestId: guest1.id,
            roomId: room101.id,
            checkedInAt: yesterday,
            expectedCheckoutAt: today,
            status: 'ACTIVE',
          }
        });

        // Create Folio for CheckIn 1
        const folioNo1 = `FOL-${Date.now().toString().slice(-6)}-101`;
        const folio1 = await tx.folio.create({
          data: {
            reservationId: res1.id,
            guestId: guest1.id,
            folioNo: folioNo1,
            openingBalance: 0,
            totalCharges: 3500.0,
            totalPayments: 1000.0,
            closingBalance: 2500.0,
            status: 'OPEN',
          }
        });

        // Folio transactions
        await tx.folioTransaction.create({
          data: {
            folioId: folio1.id,
            txnDate: yesterday,
            txnType: 'DEBIT',
            sourceModule: 'HMS',
            description: 'Room Rent Charges - 1 Night',
            debitAmount: 3500.0,
            creditAmount: 0,
            netAmount: 3500.0,
          }
        });

        await tx.folioTransaction.create({
          data: {
            folioId: folio1.id,
            txnDate: yesterday,
            txnType: 'CREDIT',
            sourceModule: 'HMS',
            description: 'Advance Paid at Booking',
            debitAmount: 0,
            creditAmount: 1000.0,
            netAmount: -1000.0,
          }
        });

        // Reservation 2 (Expected Arrival Today, Confirmed)
        await tx.reservation.create({
          data: {
            propertyId: prop.id,
            guestId: guest2.id,
            bookingNo: `RES-${Date.now().toString().slice(-6)}-103`,
            arrivalDate: today,
            departureDate: threeDaysLater,
            adults: 2,
            children: 1,
            roomTypeId: superDeluxeType.id,
            assignedRoomId: room103.id,
            status: 'CONFIRMED',
            totalAmount: 15000.0,
            advanceAmount: 3000.0,
            dueAmount: 12000.0,
            rooms: {
              create: {
                roomId: room103.id,
                ratePerNight: 5000.0,
                adults: 2,
                children: 1,
              }
            }
          }
        });
      } else {
        // Create Default Outlet for Restaurant
        const outlet = await tx.outlet.create({
          data: {
            name: 'Main POS Outlet',
            type: 'RESTAURANT',
            propertyId: prop.id,
          },
        });

        // Create Default Floor
        const floor = await tx.floor.create({
          data: {
            name: 'Ground Floor',
            order: 1,
            propertyId: prop.id,
            outletId: outlet.id,
          },
        });

        // Default Categories Seeding
        const categories = ['Starters', 'Main Course', 'Beverages', 'Desserts'];
        const catRecords = [];
        for (const catName of categories) {
          const cat = await tx.category.create({
            data: {
              name: catName,
              propertyId: prop.id,
            }
          });
          catRecords.push(cat);
        }

        // Default Products Seeding
        const products = [
          { name: 'Mineral Water', category: 'Beverages', price: 20 },
          { name: 'Masala Tea', category: 'Beverages', price: 30 },
        ];

        for (const prod of products) {
          const cat = catRecords.find(c => c.name === prod.category);
          if (cat) {
            await tx.product.create({
              data: {
                name: prod.name,
                sellingPrice: prod.price,
                propertyId: prop.id,
                categoryId: cat.id,
                outletId: outlet.id,
                productType: 'REVENUE',
              }
            });
          }
        }

        // Default Tables Seeding
        const tables = ['Table 1', 'Table 2', 'Table 3', 'Table 4'];
        for (const tableName of tables) {
          await tx.table.create({
            data: {
              name: tableName,
              floorId: floor.id,
              propertyId: prop.id,
              capacity: 4,
              status: 'VACANT',
            }
          });
        }
      }

      return prop;
    });

    return apiResponse(newProperty, 'Property and default records created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

// PUT Update Property details
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { id, name, code, type, city, state, country, organizationId: targetOrgId, whatsAppEnabled, whatsAppApiKey, whatsAppInstanceId, whatsAppTemplate } = body;

    if (!id || !name || !code) {
      return apiError(new Error('Missing required fields: id, name, code'), 400);
    }

    // Security: Only Super Admin can specify a different organizationId
    const isSuper = session.role === 'SUPER_ADMIN';
    const finalOrgId = (isSuper && targetOrgId) ? targetOrgId : session.organizationId;

    if (!finalOrgId) {
      return apiError(new Error('Organization context missing'), 400);
    }

    // Security: Ensure the property belongs to the same organization (or allow Super Admin to update any)
    const existing = await prisma.property.findFirst({
      where: isSuper ? { id } : { id, organizationId: session.organizationId },
    });
    if (!existing) return apiError(new Error('Property not found or access denied'), 404);

    // Check code uniqueness if changed
    if (existing.code !== code) {
      const codeCheck = await prisma.property.findUnique({ where: { code } });
      if (codeCheck) return apiError(new Error('Property code already exists'), 400);
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { 
        name, code, type, city, state, country,
        whatsAppEnabled,
        whatsAppApiKey,
        whatsAppInstanceId,
        whatsAppTemplate
      },
    });

    return apiResponse(updatedProperty, 'Property updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

// DELETE Property with full cascading logic for associated records
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return apiError(new Error('Missing property id'), 400);

    const isSuper = session.role === 'SUPER_ADMIN';

    // Security check: Admins can only delete their own. Super Admins can delete anything.
    const existing = await prisma.property.findFirst({
      where: isSuper ? { id } : { id, organizationId: session.organizationId },
    });
    if (!existing) return apiError(new Error('Property not found or access denied'), 404);

    // Perform manual cascade delete across all related models in a transaction
    await prisma.$transaction(async (tx: any) => {
      console.log('Transaction started for property:', id);

      // 0. Handle external nullable references first
      const propertyUsers = await tx.user.findMany({ where: { propertyId: id }, select: { id: true } });
      if (propertyUsers.length > 0) {
        const userIds = propertyUsers.map((u: any) => u.id);
        await tx.auditLog.updateMany({ where: { userId: { in: userIds } }, data: { userId: null } });
        await tx.posOrder.updateMany({ where: { servedById: { in: userIds } }, data: { servedById: null } });
      }
      
      const propertyDrivers = await tx.driver.findMany({ where: { propertyId: id }, select: { id: true } });
      if (propertyDrivers.length > 0) {
        const driverIds = propertyDrivers.map((d: any) => d.id);
        await tx.guest.updateMany({ where: { driverId: { in: driverIds } }, data: { driverId: null } });
      }

      // Nullify self-references
      await tx.offer.updateMany({ where: { propertyId: id }, data: { nextOfferId: null } });

      // 1. Level 4 (Deepest dependencies without propertyId)
      await tx.driverOfferProgress.deleteMany({ where: { offer: { propertyId: id } } });
      await tx.driverOfferHistory.deleteMany({ where: { offer: { propertyId: id } } });
      await tx.rewardPayout.deleteMany({ where: { offer: { propertyId: id } } });
      await tx.offerAuditLog.deleteMany({ where: { driver: { propertyId: id } } });
      await tx.driverGift.deleteMany({ where: { driver: { propertyId: id } } });

      await tx.checkOut.deleteMany({ where: { checkIn: { reservation: { propertyId: id } } } });
      await tx.checkIn.deleteMany({ where: { reservation: { propertyId: id } } });
      await tx.reservationRoom.deleteMany({ where: { reservation: { propertyId: id } } });

      await tx.kotStatusLog.deleteMany({ where: { kot: { propertyId: id } } });
      await tx.kotItem.deleteMany({ where: { kot: { propertyId: id } } });
      await tx.orderRating.deleteMany({ where: { order: { propertyId: id } } });
      await tx.posOrderItem.deleteMany({ where: { posOrder: { propertyId: id } } });

      await tx.invoiceItem.deleteMany({ where: { invoice: { propertyId: id } } });
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { propertyId: id } } });
      await tx.voucherEntry.deleteMany({ where: { voucher: { propertyId: id } } });

      // 2. Level 3 (Dependencies carrying propertyId)
      await tx.kotTicket.deleteMany({ where: { propertyId: id } });
      await tx.posOrder.deleteMany({ where: { propertyId: id } });
      await tx.invoice.deleteMany({ where: { propertyId: id } });
      
      // Folio must be deleted after PosOrder and Invoice since they reference Folio
      await tx.folioTransaction.deleteMany({ where: { folio: { reservation: { propertyId: id } } } });
      await tx.folio.deleteMany({ where: { reservation: { propertyId: id } } });
      await tx.reservation.deleteMany({ where: { propertyId: id } });

      await tx.purchaseOrder.deleteMany({ where: { propertyId: id } });
      await tx.purchaseInvoice.deleteMany({ where: { propertyId: id } });
      await tx.voucher.deleteMany({ where: { propertyId: id } });
      
      await tx.stockMovement.deleteMany({ where: { propertyId: id } });
      await tx.stockAdjustment.deleteMany({ where: { propertyId: id } });
      
      await tx.cashTopUp.deleteMany({ where: { propertyId: id } });
      await tx.cashWithdrawal.deleteMany({ where: { propertyId: id } });
      await tx.dayClosing.deleteMany({ where: { propertyId: id } });
      
      await tx.receipt.deleteMany({ where: { propertyId: id } });
      await tx.payment.deleteMany({ where: { propertyId: id } });
      await tx.settlement.deleteMany({ where: { propertyId: id } });
      await tx.expense.deleteMany({ where: { propertyId: id } });
      
      await tx.housekeepingTask.deleteMany({ where: { propertyId: id } });
      await tx.maintenanceTicket.deleteMany({ where: { propertyId: id } });
      await tx.auditLog.deleteMany({ where: { propertyId: id } });
      await tx.tableReservation.deleteMany({ where: { propertyId: id } });
      await tx.gstFiling.deleteMany({ where: { propertyId: id } });

      // 3. Level 2 (Mid-level owners)
      await tx.tablet.deleteMany({ where: { propertyId: id } });
      await tx.table.deleteMany({ where: { propertyId: id } });
      await tx.floor.deleteMany({ where: { propertyId: id } });
      
      await tx.product.deleteMany({ where: { propertyId: id } });
      await tx.category.deleteMany({ where: { propertyId: id } });
      
      await tx.shift.deleteMany({ where: { propertyId: id } });
      await tx.driverGiftRule.deleteMany({ where: { propertyId: id } });
      
      await tx.offer.deleteMany({ where: { propertyId: id } });
      await tx.driver.deleteMany({ where: { propertyId: id } });
      
      await tx.staffMember.deleteMany({ where: { propertyId: id } });
      await tx.user.deleteMany({ where: { propertyId: id } });

      // 4. Level 1 (Top-level configs)
      await tx.outlet.deleteMany({ where: { propertyId: id } });
      await tx.expenseCategory.deleteMany({ where: { propertyId: id } });
      await tx.paymentMode.deleteMany({ where: { propertyId: id } });
      
      await tx.stockItem.deleteMany({ where: { propertyId: id } });
      await tx.warehouse.deleteMany({ where: { propertyId: id } });
      
      await tx.room.deleteMany({ where: { propertyId: id } });
      await tx.roomType.deleteMany({ where: { propertyId: id } });

      // Final Step: Core Financials & Property itself
      await tx.account.deleteMany({ where: { propertyId: id } });
      await tx.property.delete({
        where: { id },
      });
      console.log('Deleted Property itself');
    });

    return apiResponse(null, 'Property and all associated records deleted successfully');
  } catch (error: any) {
    console.error('Delete Property Error Detail:', error);
    return apiError(new Error(`Deletion failed: ${error.message || 'Unknown error'}`), 500);
  }
}
