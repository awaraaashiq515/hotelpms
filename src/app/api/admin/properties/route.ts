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

      // 2. Create Default Outlet
      const outlet = await tx.outlet.create({
        data: {
          name: 'Main POS Outlet',
          type: 'RESTAURANT',
          propertyId: prop.id,
        },
      });

      // 2b. Create Default Floor
      const floor = await tx.floor.create({
        data: {
          name: 'Ground Floor',
          order: 1,
          propertyId: prop.id,
          outletId: outlet.id,
        },
      });

      // 3. Create Default Payment Modes
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

      // 4. Create/Get Account Group for Cash
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

      // 5. Create Cash Account
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

      // 6. Default Categories Seeding
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

      // 7. Default Products Seeding
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

      // 8. Default Tables Seeding
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
