import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const sessionRes = await fetch(new URL('/api/auth/session', req.url), {
      headers: req.headers,
    });
    const session = await sessionRes.json();

    if (!session.authenticated || (session.user.role !== 'RESTAURANTS_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return apiError('Unauthorized', 401);
    }

    const { backupData, targetPropertyId } = await req.json();

    if (!backupData || !targetPropertyId) {
      return apiError('Missing backup data or target property', 400);
    }

    // Begin Restore Transaction
    // For V1, we will focus on Menu (Categories, Products) and Outlets.
    // Full restore of all transactional data is complex due to relations.
    
    const results = await prisma.$transaction(async (tx: any) => {
      const { 
        organization, 
        posOrders, 
        invoices, 
        kotTickets, 
        drivers, 
        expenses, 
        stockMovements, 
        dayClosings, 
        shifts, 
        vouchers, 
        tableReservations,
        settlements,
        purchaseInvoices,
        stockAdjustments
      } = backupData;

      const orgId = organization.id;

      // 1. GLOBAL DATA (Organization Level)
      // A. Guests
      for (const guest of organization.guests || []) {
        const { checkIns, folios, driver, organization: orgRel, posOrders: poRel, settlements: sRel, invoices: iRel, reservations, documents, ...data } = guest;
        await tx.guest.upsert({
          where: { id: guest.id },
          update: { ...data, organizationId: orgId },
          create: { ...data, organizationId: orgId },
        });
      }

      // B. Vendors
      for (const vendor of organization.vendors || []) {
        const { purchaseInvoices, purchaseOrders, organization: orgRel, ...data } = vendor;
        await tx.vendor.upsert({
          where: { id: vendor.id },
          update: { ...data, organizationId: orgId },
          create: { ...data, organizationId: orgId },
        });
      }

      // C. Account Groups & Accounts
      for (const group of organization.accountGroups || []) {
        const { accounts, organization: orgRel, ...groupData } = group;
        await tx.accountGroup.upsert({
          where: { id: group.id },
          update: { ...groupData, organizationId: orgId },
          create: { ...groupData, organizationId: orgId },
        });

        for (const acc of accounts || []) {
          const { accountGroup, property, organization: orgRel, payments, receipts, voucherEntries, ...accData } = acc;
          await tx.account.upsert({
            where: { id: acc.id },
            update: { ...accData, organizationId: orgId, propertyId: targetPropertyId },
            create: { ...accData, organizationId: orgId, propertyId: targetPropertyId },
          });
        }
      }

      // 2. PROPERTY SETUP (Outlets, Floors, Tables, Menu)
      if (organization?.properties?.[0]) {
        const sourceProp = organization.properties[0];
        
        // Outlets
        for (const outlet of sourceProp.outlets || []) {
          const { products, posOrders, kotTickets, floors, property, ...data } = outlet;
          await tx.outlet.upsert({
            where: { id: outlet.id },
            update: { ...data, propertyId: targetPropertyId },
            create: { ...data, propertyId: targetPropertyId },
          });
        }

        // Floors
        for (const floor of sourceProp.floors || []) {
          const { tables, property, outlet, ...data } = floor;
          await tx.floor.upsert({
            where: { id: floor.id },
            update: { ...data, propertyId: targetPropertyId },
            create: { ...data, propertyId: targetPropertyId },
          });
        }

        // Tables
        for (const table of sourceProp.tables || []) {
          const { kotTickets, posOrders, floor, property, tableReservations, ...data } = table;
          await tx.table.upsert({
            where: { id: table.id },
            update: { ...data, propertyId: targetPropertyId },
            create: { ...data, propertyId: targetPropertyId },
          });
        }

        // Categories
        for (const cat of sourceProp.categories || []) {
          const { products, property, ...data } = cat;
          await tx.category.upsert({
            where: { id: cat.id },
            update: { ...data, propertyId: targetPropertyId },
            create: { ...data, propertyId: targetPropertyId },
          });
        }

        // Products
        for (const prod of sourceProp.products || []) {
          const { category, outlet, stockItem, invoiceItems, kotItems, posOrderItems, property, ...data } = prod;
          await tx.product.upsert({
            where: { id: prod.id },
            update: { ...data, propertyId: targetPropertyId },
            create: { ...data, propertyId: targetPropertyId },
          });
        }
      }

      // 3. TRANSACTIONAL DATA
      const restoreModel = async (model: string, data: any[], subItemHandler?: (item: any) => Promise<void>) => {
        if (!data) return;
        for (const item of data) {
          const { items, entries, property, outlet, guest, table, driver, folio, staffMember, order, ...mainData } = item;
          
          // Safety: ensure servedById refers to an existing user or is null
          if (mainData.servedById) {
            const userExists = await tx.user.findUnique({ where: { id: mainData.servedById } });
            if (!userExists) delete mainData.servedById;
          }

          // @ts-ignore
          await tx[model].upsert({
            where: { id: item.id },
            update: { ...mainData, propertyId: targetPropertyId },
            create: { ...mainData, propertyId: targetPropertyId },
          });

          if (subItemHandler) await subItemHandler(item);
        }
      };

      await restoreModel('driver', drivers);

      // Restore Shifts before DayClosings (DayClosing references Shift)
      await restoreModel('shift', shifts);
      await restoreModel('dayClosing', dayClosings);

      // Restore Order Sub-Items
      await restoreModel('posOrder', posOrders, async (order) => {
        if (order.items) {
          for (const sub of order.items) {
            const { product, posOrder, kotItems, ...subData } = sub;
            await tx.posOrderItem.upsert({
              where: { id: sub.id },
              update: { ...subData },
              create: { ...subData },
            });
          }
        }
      });

      // Restore Invoice Sub-Items
      await restoreModel('invoice', invoices, async (inv) => {
        if (inv.items) {
          for (const sub of inv.items) {
            const { product, invoice, ...subData } = sub;
            await tx.invoiceItem.upsert({
              where: { id: sub.id },
              update: { ...subData },
              create: { ...subData },
            });
          }
        }
      });

      await restoreModel('kotTicket', kotTickets, async (kot) => {
        if (kot.items) {
          for (const sub of kot.items) {
            const { posOrderItem, product, kot: kotRel, ...subData } = sub;
            await tx.kotItem.upsert({
              where: { id: sub.id },
              update: { ...subData },
              create: { ...subData },
            });
          }
        }
      });

      await restoreModel('expense', expenses);
      await restoreModel('stockMovement', stockMovements);
      
      await restoreModel('voucher', vouchers, async (v) => {
        if (v.entries) {
          for (const sub of v.entries) {
            const { account, voucher, ...subData } = sub;
            await tx.voucherEntry.upsert({
              where: { id: sub.id },
              update: { ...subData },
              create: { ...subData },
            });
          }
        }
      });

      await restoreModel('tableReservation', tableReservations);
      await restoreModel('settlement', settlements);
      await restoreModel('purchaseInvoice', purchaseInvoices);
      await restoreModel('stockAdjustment', stockAdjustments);

      return { success: true };
    });

    return apiResponse(results, 'Data restored successfully to the target property!');

  } catch (error: any) {
    return apiError(error);
  }
}
