import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) return apiResponse([]);

    const orgId = session.organizationId;
    const propertyId = session.propertyId;

    const [
      products, staff, guests, orders, invoices, tables, kotTickets,
      reservations, rooms, expenses, vendors, drivers, staffMembers,
      membershipCards, vouchers, folios, receipts, maintenanceTickets
    ] = await Promise.all([
      // Products
      prisma.product.findMany({
        where: { propertyId, OR: [{ name: { contains: query } }, { sku: { contains: query } }] },
        take: 5, include: { category: true }
      }),
      // Staff (Users)
      prisma.user.findMany({
        where: { organizationId: orgId, fullName: { contains: query } },
        take: 3, include: { role: true }
      }),
      // Customers (Guests)
      prisma.guest.findMany({
        where: { organizationId: orgId, OR: [{ firstName: { contains: query } }, { lastName: { contains: query } }, { mobile: { contains: query } }] },
        take: 5,
      }),
      // Active Orders
      prisma.posOrder.findMany({
        where: { propertyId, OR: [{ orderNo: { contains: query } }, { tableNo: { contains: query } }] },
        take: 5, orderBy: { createdAt: 'desc' }
      }),
      // Invoices
      prisma.invoice.findMany({
        where: { propertyId, OR: [{ invoiceNo: { contains: query } }, { tableNo: { contains: query } }] },
        take: 5, orderBy: { invoiceDate: 'desc' }
      }),
      // Tables
      prisma.table.findMany({
        where: { propertyId, name: { contains: query } },
        take: 3
      }),
      // KOTs
      prisma.kotTicket.findMany({
        where: { propertyId, OR: [{ kotNo: { contains: query } }, { tableNo: { contains: query } }] },
        take: 3, orderBy: { createdAt: 'desc' }
      }),
      // Reservations
      prisma.reservation.findMany({
        where: { propertyId, bookingNo: { contains: query } },
        take: 3, include: { guest: true }
      }),
      // Rooms
      prisma.room.findMany({
        where: { propertyId, roomNumber: { contains: query } },
        take: 3
      }),
      // Expenses
      prisma.expense.findMany({
        where: { propertyId, OR: [{ expenseNo: { contains: query } }, { description: { contains: query } }, { paidTo: { contains: query } }] },
        take: 3
      }),
      // Vendors
      prisma.vendor.findMany({
        where: { organizationId: orgId, OR: [{ name: { contains: query } }, { mobile: { contains: query } }] },
        take: 3
      }),
      // Drivers
      prisma.driver.findMany({
        where: { propertyId, OR: [{ name: { contains: query } }, { phone: { contains: query } }, { vehicleNumber: { contains: query } }] },
        take: 3
      }),
      // Staff Members
      prisma.staffMember.findMany({
        where: { propertyId, OR: [{ name: { contains: query } }, { phone: { contains: query } }] },
        take: 3
      }),
      // Membership Cards
      prisma.membershipCard.findMany({
        where: { cardNumber: { contains: query } },
        take: 3
      }),
      // Vouchers
      prisma.voucher.findMany({
        where: { propertyId, voucherNo: { contains: query } },
        take: 3
      }),
      // Folios
      prisma.folio.findMany({
        where: { folioNo: { contains: query } },
        take: 3
      }),
      // Receipts
      prisma.receipt.findMany({
        where: { propertyId, receiptNo: { contains: query } },
        take: 3
      }),
      // Maintenance Tickets
      prisma.maintenanceTicket.findMany({
        where: { propertyId, ticketNo: { contains: query } },
        take: 3
      })
    ]);

    const results = [
      ...orders.map((o: any) => ({ 
        id: o.id, type: 'Order', title: `Order #${o.orderNo}`, 
        subtitle: o.tableNo ? `Table: ${o.tableNo}` : o.orderType,
        status: o.status, url: `/orders/${o.id}` 
      })),
      ...invoices.map((i: any) => ({ 
        id: i.id, type: 'Invoice', title: `Bill #${i.invoiceNo}`, 
        subtitle: i.tableNo ? `Table: ${i.tableNo} • ₹${i.totalAmount}` : `₹${i.totalAmount}`,
        status: i.paymentStatus, url: `/invoices/${i.id}` 
      })),
      ...kotTickets.map((k: any) => ({
        id: k.id, type: 'KOT', title: `KOT #${k.kotNo}`,
        subtitle: k.tableNo ? `Table: ${k.tableNo}` : 'Direct Order',
        status: k.status, url: `/kitchen-display`
      })),
      ...reservations.map((r: any) => ({
        id: r.id, type: 'Reservation', title: `Res #${r.bookingNo}`,
        subtitle: `${r.guest?.firstName} ${r.guest?.lastName || ''} • ${r.status}`,
        url: `/reservations`
      })),
      ...rooms.map((rm: any) => ({
        id: rm.id, type: 'Room', title: `Room ${rm.roomNumber}`,
        subtitle: `${rm.status} • ${rm.housekeepingStatus}`,
        url: `/rooms`
      })),
      ...products.map((p: any) => ({ 
        id: p.id, type: 'Product', title: p.name, 
        subtitle: `${p.category?.name || 'Item'} • ₹${p.sellingPrice}`,
        url: `/inventory/products` 
      })),
      ...expenses.map((e: any) => ({
        id: e.id, type: 'Expense', title: `Expense #${e.expenseNo}`,
        subtitle: `${e.paidTo || 'N/A'} • ₹${e.amount}`,
        url: `/expenses`
      })),
      ...vendors.map((v: any) => ({
        id: v.id, type: 'Vendor', title: v.name,
        subtitle: v.mobile || 'No phone',
        url: `/vendors`
      })),
      ...drivers.map((d: any) => ({
        id: d.id, type: 'Driver', title: d.name,
        subtitle: `${d.vehicleNumber || ''} • ${d.phone || ''}`,
        url: `/drivers`
      })),
      ...membershipCards.map((m: any) => ({
        id: m.id, type: 'Membership', title: `Card #${m.cardNumber}`,
        subtitle: m.status,
        url: `/memberships`
      })),
      ...vouchers.map((v: any) => ({
        id: v.id, type: 'Voucher', title: `Voucher #${v.voucherNo}`,
        subtitle: v.status,
        url: `/vouchers`
      })),
      ...folios.map((f: any) => ({
        id: f.id, type: 'Folio', title: `Folio #${f.folioNo}`,
        subtitle: f.status,
        url: `/folios`
      })),
      ...receipts.map((r: any) => ({
        id: r.id, type: 'Receipt', title: `Receipt #${r.receiptNo}`,
        subtitle: `₹${r.amount}`,
        url: `/receipts`
      })),
      ...maintenanceTickets.map((mt: any) => ({
        id: mt.id, type: 'Maintenance', title: `Ticket #${mt.ticketNo}`,
        subtitle: `${mt.issueType} • ${mt.status}`,
        url: `/maintenance`
      })),
      ...tables.map((t: any) => ({ 
        id: t.id, type: 'Table', title: `Table ${t.name}`, 
        subtitle: `Status: ${t.status}`, url: `/operations/tables` 
      })),
      ...guests.map((c: any) => ({ 
        id: c.id, type: 'Customer', title: `${c.firstName} ${c.lastName || ''}`, 
        subtitle: c.mobile || 'No phone', url: `/customers` 
      })),
      ...staffMembers.map((sm: any) => ({
        id: sm.id, type: 'Staff', title: sm.name,
        subtitle: sm.designation || 'Staff',
        url: `/staff`
      })),
      ...staff.map((s: any) => ({ 
        id: s.id, type: 'Staff', title: s.fullName, 
        subtitle: s.role?.name || 'User', url: `/staff` 
      })),
    ];

    return apiResponse(results);
  } catch (error) {
    console.error('Search API Error:', error);
    return apiError(error);
  }
}
