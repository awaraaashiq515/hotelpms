import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

/**
 * Public API: Place a Home Delivery order.
 * No tableId required — propertyId + delivery details only.
 * POST /api/public/order/delivery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyId,
      items,
      guestName,
      guestPhone,
      deliveryAddress,
      deliveryInstructions,
      deliveryLat,
      deliveryLng,
      isPrepaid,
      orderType = 'DELIVERY',  // 'DELIVERY' or 'TAKEAWAY'
    } = body;

    if (!propertyId || !items || items.length === 0) {
      return apiError(new Error('propertyId and items are required'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch property
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: { id: true, organizationId: true }
      });
      if (!property) throw new Error('Property not found');

      const outlet = await tx.outlet.findFirst({ where: { propertyId } });
      if (!outlet) throw new Error('POS Outlet not found');

      // 2. Find or create guest
      let guestId = null;
      if (guestPhone) {
        let guest = await tx.guest.findFirst({
          where: { mobile: guestPhone, organizationId: property.organizationId }
        });
        if (!guest) {
          guest = await tx.guest.create({
            data: {
              firstName: guestName || 'Guest',
              mobile: guestPhone,
              organizationId: property.organizationId
            }
          });
        }
        guestId = guest.id;
      }

      // 3. Auto-find or create a virtual "Home Delivery" floor+table for this property
      //    This is needed for KOT creation only — it won't conflict with real tables.
      let deliveryFloor = await tx.floor.findFirst({
        where: { propertyId, name: '__Delivery__' }
      });
      if (!deliveryFloor) {
        deliveryFloor = await tx.floor.create({
          data: { propertyId, name: '__Delivery__', displayOrder: 999 }
        });
      }

      let deliveryTable = await tx.table.findFirst({
        where: { propertyId, floorId: deliveryFloor.id, name: 'Home Delivery' }
      });
      if (!deliveryTable) {
        deliveryTable = await tx.table.create({
          data: {
            propertyId,
            floorId: deliveryFloor.id,
            name: 'Home Delivery',
            capacity: 0,
            status: 'AVAILABLE',
            qrToken: `delivery-${propertyId}`,
          }
        });
      }

      // 4. Create new order (delivery orders are always fresh — no merging)
      const order = await tx.posOrder.create({
        data: {
          propertyId,
          outletId: outlet.id,
          orderNo: `DEL-${Date.now()}`,
          orderType: orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'DELIVERY',
          status: isPrepaid ? 'PAYMENT_AWAITING_APPROVAL' : 'OPEN',
          restaurantTableId: null,          // no physical table
          tableNo: orderType === 'TAKEAWAY' ? 'Take Away' : 'Delivery',
          guestId,
          deliveryCustomerName: guestName || null,
          deliveryPhone: guestPhone || null,
          deliveryAddress: deliveryAddress || null,
          deliveryInstructions: deliveryInstructions || null,
          deliveryLat: deliveryLat ? parseFloat(deliveryLat) : null,
          deliveryLng: deliveryLng ? parseFloat(deliveryLng) : null,
        },
        include: { items: true }
      });

      // 5. Process items
      const newItemsForKot: any[] = [];
      let subtotal = 0, taxAmount = 0, grandTotal = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product) throw new Error(`Product not found: ${item.id}`);

        const newItem = await tx.posOrderItem.create({
          data: {
            posOrderId: order.id,
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.sellingPrice || 0,
            totalAmount: item.quantity * (item.sellingPrice || 0),
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            portion: item.portion || 'FULL',
          }
        });

        // Tax calc
        const itemTotal = newItem.totalAmount;
        const taxRate = product.taxRate ?? 5;
        const taxType = product.taxType || 'EXCLUSIVE';
        let itemSub = 0, itemTax = 0;
        if (taxType === 'EXEMPT') { itemSub = itemTotal; itemTax = 0; }
        else if (taxType === 'INCLUSIVE') { itemSub = itemTotal / (1 + taxRate / 100); itemTax = itemTotal - itemSub; }
        else { itemSub = itemTotal; itemTax = itemTotal * (taxRate / 100); }

        await tx.posOrderItem.update({ where: { id: newItem.id }, data: { taxAmount: itemTax } });
        subtotal += itemSub; taxAmount += itemTax; grandTotal += (itemSub + itemTax);

        newItemsForKot.push({
          ...item,
          name: product.name,
          orderItemId: newItem.id,
          variantId: item.variantId || null,
          variantName: item.variantName || null,
          portion: item.portion || 'FULL',
        });
      }

      // 6. Update order totals
      await tx.posOrder.update({
        where: { id: order.id },
        data: {
          subtotal,
          taxAmount,
          grandTotal,
          status: isPrepaid ? 'PAYMENT_AWAITING_APPROVAL' : 'OPEN',
          ...(isPrepaid ? { onlinePaymentMethod: 'UPI', paymentRequested: true } : {})
        }
      });

      // 7. Create KOT (using virtual delivery table for reference)
      let kotTicket: any = null;
      if (newItemsForKot.length > 0) {
        kotTicket = await tx.kotTicket.create({
          data: {
            kotNo: `KOT-DEL-${Date.now()}`,
            orderId: order.id,
            propertyId,
            outletId: outlet.id,
            restaurantTableId: deliveryTable.id,
            tableNo: orderType === 'TAKEAWAY' ? 'Take Away' : 'Delivery',
            status: 'NEW',
            createdBy: 'Self-Service (Home Delivery QR)'
          }
        });

        await tx.kotItem.createMany({
          data: newItemsForKot.map((item: any) => ({
            kotId: kotTicket.id,
            orderItemId: item.orderItemId,
            productId: item.id,
            itemName: item.name,
            quantity: item.quantity,
            status: 'NEW',
            variantId: item.variantId,
            variantName: item.variantName,
            portion: item.portion,
          }))
        });
      }

      // 8. Real-time notification
      const itemSummary = newItemsForKot.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
      const { createNotification } = await import('@/lib/notificationService');
      const label = orderType === 'TAKEAWAY' ? 'Pickup' : 'Home Delivery';

      await createNotification({
        propertyId,
        title: `New ${label} Order`,
        message: `New ${label.toLowerCase()} from ${guestName || 'Guest'}: ${itemSummary}`,
        type: 'ORDER',
        priority: 'URGENT',
        metadata: {
          tableId: null,
          tableName: label,
          floorName: null,
          amount: grandTotal,
          orderId: order.id,
          orderNo: order.orderNo,
          items: newItemsForKot.map((i: any) => ({ name: i.name, qty: i.quantity })),
          link: `/billing?orderId=${order.id}`
        }
      }, tx);

      return { orderNo: order.orderNo, kotNo: kotTicket?.kotNo, orderId: order.id, isPrepaid };
    });

    return apiResponse(result, 'Order placed successfully', 201);
  } catch (error) {
    console.error('Delivery Order API Error:', error);
    return apiError(error);
  }
}
