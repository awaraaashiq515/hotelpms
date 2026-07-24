import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { recordDriverActivity } from '@/lib/incentive-utils';
import { createNotification } from '@/lib/notificationService';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendSMS } from '@/lib/notificationService';

// Helper: send WhatsApp + SMS fallback for delivery events
async function sendDeliveryNotification(
  phone: string,
  message: string,
  propertyId: string
) {
  try {
    const result = await sendWhatsAppMessage({ mobile: phone, message, propertyId });
    // If WA was not delivered via API (manual mode), fallback to SMS
    if (!result || result.mode === 'MANUAL') {
      await sendSMS(phone, 'TEMPLATE_BILL_PAID', {
        NAME: 'Customer',
        AMOUNT: '',
        HOTEL: '',
        ORDER_NO: '',
      }).catch(() => {});
    }
  } catch (e) {
    console.error('[DeliveryNotif] error:', e);
  }
}

import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // No session required — tablets need to poll order status without auth

    const order = await prisma.posOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) return apiError(new Error('Order not found'), 404);

    return apiResponse(order);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const wtUser = await getWTUserFromRequest(request);
    if (!session && !wtUser) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { status, driverId, preparationTime, onlinePaymentReference } = body;

    const existingOrder = await prisma.posOrder.findUnique({
      where: { id }
    });
    const isDelivery = existingOrder?.orderType === 'DELIVERY';

    const dataToUpdate: any = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'PAYMENT_AWAITING_APPROVAL' && session?.id) {
        dataToUpdate.servedById = session.id;
      }
    }
    if (onlinePaymentReference !== undefined) {
      dataToUpdate.onlinePaymentReference = onlinePaymentReference;
    }
    if (preparationTime !== undefined) {
      dataToUpdate.preparationTime = parseInt(preparationTime, 10) || 15;
    }
    
    if (driverId !== undefined) {
      dataToUpdate.driverId = driverId || null;
      if (isDelivery) {
        dataToUpdate.deliveryRiderId = driverId || null;
      } else {
        dataToUpdate.deliveryRiderId = null;
      }
    }

    const order = await prisma.posOrder.update({
      where: { id },
      data: dataToUpdate,
      include: { driver: true, deliveryRider: true, property: true }
    });

    // --- Reset Table Status to VACANT on Order Completion ---
    if ((status === 'COMPLETED' || status === 'PAID' || status === 'SETTLED') && order.restaurantTableId) {
      await prisma.table.update({
        where: { id: order.restaurantTableId },
        data: { status: 'VACANT' }
      }).catch(() => {});
    }

    // --- Sync KOT Ticket Status ---
    if (status === 'SERVED' || status === 'COMPLETED' || status === 'PAID') {
      await prisma.kotTicket.updateMany({
        where: { orderId: id, status: { notIn: ['SERVED', 'CANCELLED'] } },
        data: { status: 'SERVED' }
      });
      await prisma.kotItem.updateMany({
        where: { kot: { orderId: id }, status: { notIn: ['SERVED', 'CANCELLED'] } },
        data: { status: 'SERVED' }
      });
    }

    // --- Incentive Engine Integration ---
    if ((status === 'COMPLETED' || status === 'PAID') && order.driverId) {
       await recordDriverActivity(order.driverId, 'RIDE');
    }

    // ─── Delivery WhatsApp + SMS Notifications ────────────────────────────────
    if (isDelivery || order.orderType === 'DELIVERY') {
      const customerPhone = (order as any).deliveryPhone;
      const propertyName = (order as any).property?.name || 'Restaurant';
      const orderNo = order.orderNo;

      try {
        // 1. Kitchen Started
        if (status === 'IN_KITCHEN' || status === 'KOT_RUNNING') {
          if (customerPhone) {
            sendDeliveryNotification(
              customerPhone,
              `🍳 *${propertyName}*\nYour order *#${orderNo}* is now being prepared in the kitchen!\nWe'll notify you when it's on the way. 🚴`,
              order.propertyId
            ).catch(() => {});
          }
          // Manager notification (new order started)
          await createNotification({
            propertyId: order.propertyId,
            title: '👨‍🍳 Kitchen Started',
            message: `Order #${orderNo} is now being prepared. Customer: ${(order as any).deliveryCustomerName || 'Guest'}`,
            type: 'ORDER',
            priority: 'MEDIUM',
            metadata: { orderId: order.id, link: `/operations/delivery` }
          });
        }

        // 2. Rider Assigned — notify rider tab (in-portal refresh) + manager
        if (driverId !== undefined && driverId) {
          await createNotification({
            propertyId: order.propertyId,
            title: '🛵 Rider Assigned',
            message: `Order #${orderNo} assigned to rider. Delivery to ${(order as any).deliveryAddress || 'address'}.`,
            type: 'ORDER',
            priority: 'MEDIUM',
            metadata: { orderId: order.id, riderId: driverId, link: `/operations/delivery` }
          });
        }

        // 3. Out for Delivery — WhatsApp to customer
        if (status === 'OUT_FOR_DELIVERY') {
          if (customerPhone) {
            sendDeliveryNotification(
              customerPhone,
              `🛵 *${propertyName}*\nGreat news! Your order *#${orderNo}* has been picked up and is on its way to you!\n\nTrack your order live: ${process.env.NEXT_PUBLIC_BASE_URL || ''}/order/${order.id}/track\n\nEstimated delivery: 20–30 min ⏱️`,
              order.propertyId
            ).catch(() => {});
          }
          await createNotification({
            propertyId: order.propertyId,
            title: '🛵 Order Out for Delivery',
            message: `Order #${orderNo} is out for delivery. Customer: ${(order as any).deliveryCustomerName || 'Guest'}`,
            type: 'ORDER',
            priority: 'LOW',
            metadata: { orderId: order.id, link: `/operations/delivery` }
          });
        }

        // 4. Delivered (SETTLED from driver OTP) — WhatsApp + auto-review request
        if (status === 'SETTLED' && existingOrder?.orderType === 'DELIVERY') {
          if (customerPhone) {
            sendDeliveryNotification(
              customerPhone,
              `✅ *${propertyName}*\nYour order *#${orderNo}* has been delivered successfully! 🎉\n\nThank you for ordering with us. Enjoy your meal!\n\nWe'd love your feedback — just reply with a rating (1-5 ⭐)`,
              order.propertyId
            ).catch(() => {});

            // Schedule auto-review request after 30 min via a delayed notification
            setTimeout(() => {
              sendDeliveryNotification(
                customerPhone,
                `⭐ *${propertyName}*\nHow was your delivery experience for order *#${orderNo}*?\n\nPlease take 2 seconds to rate us:\n⭐ 1  ⭐⭐ 2  ⭐⭐⭐ 3  ⭐⭐⭐⭐ 4  ⭐⭐⭐⭐⭐ 5\n\nYour feedback helps us serve you better! 🙏`,
                order.propertyId
              ).catch(() => {});
            }, 30 * 60 * 1000); // 30 minutes
          }
        }

        // 5. Existing notification for BILL_PRINTED / PENDING
        if (status === 'BILL_PRINTED' || status === 'PENDING') {
          await createNotification({
            propertyId: order.propertyId,
            title: status === 'BILL_PRINTED' ? 'Payment Requested' : 'Order Pending',
            message: `Action required for Order ${orderNo} at ${order.tableNo ? 'Table ' + order.tableNo : 'POS'}`,
            type: 'PAYMENT',
            priority: 'HIGH',
            metadata: {
              orderId: order.id,
              status,
              link: `/billing?orderId=${order.id}`
            }
          });
        }
      } catch (notifError) {
        console.error('[Order Notification] error:', notifError);
      }
    } else {
      // Non-delivery order — keep original notification logic
      try {
        if (status === 'BILL_PRINTED' || status === 'PENDING') {
          await createNotification({
            propertyId: order.propertyId,
            title: status === 'BILL_PRINTED' ? 'Payment Requested' : 'Order Pending',
            message: `Action required for Order ${order.orderNo} at ${order.tableNo ? 'Table ' + order.tableNo : 'POS'}`,
            type: 'PAYMENT',
            priority: 'HIGH',
            metadata: {
              orderId: order.id,
              status,
              link: `/billing?orderId=${order.id}`
            }
          });
        }
      } catch (notifError) {
        console.error('[Order Notification] error:', notifError);
      }
    }

    return apiResponse(order, 'Order status updated');
  } catch (error) {
    return apiError(error);
  }
}

