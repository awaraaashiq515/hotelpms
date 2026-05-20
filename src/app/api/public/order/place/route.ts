import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

/**
 * Public API to place an order from a QR code scan.
 * No authentication required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      items, 
      tableId, 
      propertyId, 
      guestName, 
      guestPhone, 
      paymentMethod, 
      isPrepaid, 
      rating, 
      comments,
      orderType,
      deliveryCustomerName,
      deliveryPhone,
      deliveryAddress,
      deliveryInstructions,
      deliveryLat,
      deliveryLng
    } = body;

    const orderTypeParam = orderType === 'PICKUP' ? 'TAKEAWAY' : (orderType || 'DINE_IN');

    if (!tableId || !propertyId || !items || items.length === 0) {
      return apiError(new Error('Missing required fields (tableId, propertyId, items)'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: { id: true, organizationId: true }
      });

      const table = await tx.table.findUnique({
        where: { id: tableId },
        include: { floor: true }
      });

      if (!table || !property || table.propertyId !== propertyId) {
        throw new Error('Invalid table or property reference');
      }

      let guestId = null;
      if (guestPhone) {
        let guest = await tx.guest.findFirst({
          where: { mobile: guestPhone, organizationId: property.organizationId }
        });
        if (!guest) {
          guest = await tx.guest.create({
            data: { firstName: guestName || 'Guest', mobile: guestPhone, organizationId: property.organizationId }
          });
        }
        guestId = guest.id;
      }

      const outlet = await tx.outlet.findFirst({ where: { propertyId } });
      if (!outlet) throw new Error('POS Outlet not found');

      // 2. Find or create the PosOrder
      let order = null;
      if (orderTypeParam === 'DINE_IN') {
        order = await tx.posOrder.findFirst({
          where: { 
            restaurantTableId: tableId,
            status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL'] },
            orderType: 'DINE_IN',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
          include: { items: true }
        });
      }

      if (!order) {
        order = await tx.posOrder.create({
          data: {
            propertyId,
            outletId: outlet.id,
            orderNo: `QR-${Date.now()}`,
            orderType: orderTypeParam,
            status: isPrepaid ? 'PAYMENT_AWAITING_APPROVAL' : 'OPEN',
            restaurantTableId: orderTypeParam === 'DINE_IN' ? tableId : null,
            tableNo: orderTypeParam === 'DINE_IN' ? table.name : (orderTypeParam === 'DELIVERY' ? 'Delivery' : 'Take Away'),
            guestId: guestId,
            deliveryCustomerName: deliveryCustomerName || guestName || null,
            deliveryPhone: deliveryPhone || guestPhone || null,
            deliveryAddress: deliveryAddress || null,
            deliveryInstructions: deliveryInstructions || null,
            deliveryLat: deliveryLat ? parseFloat(deliveryLat) : null,
            deliveryLng: deliveryLng ? parseFloat(deliveryLng) : null,
          },
          include: { items: true }
        });
      } else {
        if (guestId && !order.guestId) {
          await tx.posOrder.update({ where: { id: order.id }, data: { guestId } });
        }
      }

      // 3. Process items for KOT
      const newItemsForKot: any[] = [];
      for (const item of items) {
        const variantId = item.variantId || null;
        const portion = item.portion || 'FULL';

        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product) throw new Error(`Product not found: ${item.id}`);

        const existingItem = (order as any).items.find((ei: any) => 
          ei.productId === item.id && 
          (ei.variantId || null) === variantId && 
          (ei.portion || 'FULL') === portion
        );

        if (existingItem) {
          const newTotalQty = existingItem.quantity + item.quantity;
          await tx.posOrderItem.update({
            where: { id: existingItem.id },
            data: { quantity: newTotalQty, totalAmount: newTotalQty * (item.sellingPrice || 0) }
          });
          newItemsForKot.push({ 
            ...item, 
            name: product.name,
            quantity: item.quantity, 
            orderItemId: existingItem.id,
            variantId,
            variantName: item.variantName,
            portion
          });
        } else {
          const newItem = await tx.posOrderItem.create({
            data: {
              posOrderId: order!.id,
              productId: item.id,
              quantity: item.quantity,
              unitPrice: item.sellingPrice || 0,
              totalAmount: item.quantity * (item.sellingPrice || 0),
              variantId,
              variantName: item.variantName,
              portion
            }
          });
          newItemsForKot.push({ 
            ...item, 
            name: product.name,
            quantity: item.quantity, 
            orderItemId: newItem.id,
            variantId,
            variantName: item.variantName,
            portion
          });
        }
      }

      // 4. Update Order Totals
      const allUpdatedItems = await tx.posOrderItem.findMany({
        where: { posOrderId: order!.id },
        include: { product: true }
      });
      
      let subtotal = 0;
      let taxAmount = 0;
      let grandTotal = 0;

      for (const i of allUpdatedItems) {
        const itemTotal = i.totalAmount;
        const taxRate = i.product.taxRate ?? 5;
        const taxType = i.product.taxType || 'EXCLUSIVE';
        let itemSub = 0, itemTax = 0;

        if (taxType === 'EXEMPT') { itemSub = itemTotal; itemTax = 0; }
        else if (taxType === 'INCLUSIVE') { itemSub = itemTotal / (1 + (taxRate / 100)); itemTax = itemTotal - itemSub; }
        else { itemSub = itemTotal; itemTax = itemTotal * (taxRate / 100); }

        await tx.posOrderItem.update({ where: { id: i.id }, data: { taxAmount: itemTax } });
        subtotal += itemSub; taxAmount += itemTax; grandTotal += (itemSub + itemTax);
      }

      await tx.posOrder.update({
        where: { id: order!.id },
        data: { subtotal, taxAmount, grandTotal, status: isPrepaid ? 'PAYMENT_AWAITING_APPROVAL' : 'OPEN' }
      });

      // 4.5 Save Rating if provided
      if (rating) {
        await tx.orderRating.upsert({
          where: { orderId: order!.id },
          update: { rating, comments },
          create: { orderId: order!.id, rating, comments }
        });
      }

      // 5. Generate KOT
      let kotTicket: any = null;
      if (newItemsForKot.length > 0) {
        kotTicket = await (tx as any).kotTicket.create({
          data: {
            kotNo: `KOT-QR-${Date.now()}`,
            orderId: order!.id,
            propertyId, outletId: outlet.id,
            restaurantTableId: tableId, tableNo: table.name,
            status: 'NEW', createdBy: 'Self-Service (QR)'
          }
        });
        await (tx as any).kotItem.createMany({
          data: newItemsForKot.map((item: any) => {
            return {
              kotId: kotTicket.id, 
              orderItemId: item.orderItemId,
              productId: item.id, 
              itemName: item.name, 
              quantity: item.quantity, 
              status: 'NEW',
              variantId: item.variantId,
              variantName: item.variantName,
              portion: item.portion
            };
          }),
        });
      }

      // 6. Handle Payment & Settlement for Prepaid
      if (isPrepaid) {
        // Instead of immediate settlement, we mark it as awaiting approval
        await tx.posOrder.update({
          where: { id: order!.id },
          data: { 
            status: 'PAYMENT_AWAITING_APPROVAL',
            onlinePaymentMethod: 'UPI',
            paymentRequested: true 
          }
        });
      }

      if (orderTypeParam === 'DINE_IN') {
        await (tx as any).table.update({
          where: { id: tableId },
          data: { status: 'KOT_RUNNING' }
        });
      }

      // 8. Create Real-Time Notifications for Dashboard
      const itemSummary = newItemsForKot.map(i => `${i.quantity}x ${i.name}`).join(', ');
      const { createNotification } = await import('@/lib/notificationService');

      const orderLabel = orderTypeParam === 'DELIVERY' ? 'Home Delivery' : (orderTypeParam === 'TAKEAWAY' ? 'Take Away' : `Table ${table.name}`);
      const locationLabel = orderTypeParam === 'DINE_IN' ? `Table ${table.name} (${table.floor.name})` : (orderTypeParam === 'DELIVERY' ? `Home Delivery (${deliveryCustomerName || guestName || 'Guest'})` : `Take Away (${deliveryCustomerName || guestName || 'Guest'})`);

      // Always create an ORDER notification
      await createNotification({
        propertyId,
        title: `New ${orderTypeParam === 'DELIVERY' ? 'Delivery' : orderTypeParam === 'TAKEAWAY' ? 'Pickup' : 'Table'} QR Order`,
        message: `New order from ${locationLabel}: ${itemSummary}`,
        type: 'ORDER',
        priority: 'MEDIUM',
        metadata: {
          tableId: orderTypeParam === 'DINE_IN' ? tableId : null,
          tableName: orderTypeParam === 'DINE_IN' ? table.name : (orderTypeParam === 'DELIVERY' ? 'Delivery' : 'Take Away'),
          floorName: orderTypeParam === 'DINE_IN' ? table.floor.name : null,
          amount: grandTotal,
          orderId: order!.id,
          orderNo: order!.orderNo,
          items: newItemsForKot.map(i => ({ name: i.name, qty: i.quantity })),
          link: `/billing?orderId=${order!.id}`
        },
      }, tx);

      // If it's a payment (Prepaid/Online), create a second notification for the PAYMENT
      if (isPrepaid) {
        await createNotification({
          propertyId,
          title: 'Online Payment Received',
          message: `Payment of ₹${grandTotal.toFixed(2)} received from ${locationLabel}`,
          type: 'PAYMENT',
          priority: 'URGENT',
          metadata: {
            tableId: orderTypeParam === 'DINE_IN' ? tableId : null,
            tableName: orderTypeParam === 'DINE_IN' ? table.name : (orderTypeParam === 'DELIVERY' ? 'Delivery' : 'Take Away'),
            floorName: orderTypeParam === 'DINE_IN' ? table.floor.name : null,
            amount: grandTotal,
            orderId: order!.id,
            orderNo: order!.orderNo,
            paymentMethod: 'UPI',
            link: `/billing?orderId=${order!.id}`
          },
        }, tx);
      }

      return { orderNo: order!.orderNo, kotNo: kotTicket?.kotNo, isPrepaid };
    });

    return apiResponse(result, 'Order placed successfully', 201);
  } catch (error) {
    console.error('Public Place Order Error:', error);
    return apiError(error);
  }
}
