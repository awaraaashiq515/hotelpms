import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

function getDeliveryOtp(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const otp = Math.abs(hash % 9000 + 1000);
  return otp.toString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list-properties') {
      const properties = await prisma.property.findMany({
        select: { id: true, name: true, code: true }
      });
      return apiResponse(properties, 'Properties fetched successfully');
    }

    if (action === 'get-restaurant-location') {
      const propertyId = searchParams.get('propertyId');
      if (!propertyId) return apiError(new Error('propertyId is required'), 400);
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, name: true, address: true, city: true, state: true, phone: true, latitude: true, longitude: true }
      });
      if (!property) return apiError(new Error('Property not found'), 404);
      return apiResponse(property, 'Restaurant location fetched');
    }

    if (action === 'list-drivers') {
      const activeRiders = await prisma.user.findMany({
        where: {
          role: { name: 'DELIVERY_RIDER' },
          isActive: true
        },
        orderBy: {
          fullName: 'asc'
        }
      });
      
      const formatted = activeRiders.map((u: any) => ({
        id: u.id,
        name: u.fullName,
        phone: u.phone,
        vehicleNumber: u.vehicleNumber,
        vehicleType: u.vehicleType || 'BIKE',
        isActive: u.isActive,
        dutyStatus: u.wtStatus || 'offline',
        deliveryRadius: u.deliveryRadius || 5.0,
        deliveryLat: u.deliveryLat,
        deliveryLng: u.deliveryLng
      }));

      return apiResponse(formatted, 'Riders fetched successfully');
    }

    if (action === 'active-orders') {
      const driverId = searchParams.get('driverId');
      if (!driverId) {
        return apiError(new Error('driverId is required for active orders'), 400);
      }

      const driverUser = await prisma.user.findUnique({
        where: { id: driverId }
      });

      if (!driverUser) {
        return apiError(new Error('Driver profile not found'), 404);
      }

      const assignedOrders = await prisma.posOrder.findMany({
        where: {
          deliveryRiderId: driverId,
          status: {
            in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL', 'OUT_FOR_DELIVERY']
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          property: {
            select: { id: true, name: true, address: true, city: true, phone: true, latitude: true, longitude: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      let unassignedOrders: any[] = [];
      
      if (driverUser.propertyId) {
        // Tied to property -> only get unassigned orders from this branch
        unassignedOrders = await prisma.posOrder.findMany({
          where: {
            orderType: 'DELIVERY',
            deliveryRiderId: null,
            propertyId: driverUser.propertyId,
            status: {
              in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL']
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            },
            property: {
              select: { id: true, name: true, address: true, city: true, phone: true, latitude: true, longitude: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      } else {
        // Not tied to branch -> filter by Google Maps location and radius
        const allUnassigned = await prisma.posOrder.findMany({
          where: {
            orderType: 'DELIVERY',
            deliveryRiderId: null,
            status: {
              in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL']
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            },
            property: {
              select: { id: true, name: true, address: true, city: true, phone: true, latitude: true, longitude: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (driverUser.deliveryLat && driverUser.deliveryLng) {
          const radiusKm = driverUser.deliveryRadius || 5.0;
          unassignedOrders = allUnassigned.filter((order: any) => {
            if (order.deliveryLat && order.deliveryLng) {
              const R = 6371; // Earth radius in km
              const dLat = (order.deliveryLat - driverUser.deliveryLat!) * Math.PI / 180;
              const dLng = (order.deliveryLng - driverUser.deliveryLng!) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(driverUser.deliveryLat! * Math.PI / 180) * Math.cos(order.deliveryLat * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distance = R * c;
              return distance <= radiusKm;
            }
            if (driverUser.deliveryLocation && order.deliveryAddress) {
              return order.deliveryAddress.toLowerCase().includes(driverUser.deliveryLocation.toLowerCase());
            }
            return false;
          });
        } else if (driverUser.deliveryLocation) {
          unassignedOrders = allUnassigned.filter((order: any) => 
            order.deliveryAddress && 
            order.deliveryAddress.toLowerCase().includes(driverUser.deliveryLocation!.toLowerCase())
          );
        } else {
          unassignedOrders = allUnassigned;
        }
      }

      return apiResponse({ assigned: assignedOrders, unassigned: unassignedOrders }, 'Assigned & available orders fetched successfully');
    }

    if (action === 'order-history') {
      const driverId = searchParams.get('driverId');
      if (!driverId) {
        return apiError(new Error('driverId is required for order history'), 400);
      }

      const history = await prisma.posOrder.findMany({
        where: {
          deliveryRiderId: driverId,
          status: { in: ['SETTLED', 'COMPLETED', 'DELIVERED'] }
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, image: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 100
      });

      const formatted = history.map((o: any) => ({
        id: o.id,
        orderNo: o.orderNo,
        grandTotal: o.grandTotal,
        deliveryCustomerName: o.deliveryCustomerName,
        deliveryAddress: o.deliveryAddress,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        isPrepaid: o.isPrepaid || false,
        codCollected: o.codCollected || false,
        codAmountCollected: o.codAmountCollected || 0,
        tipAmount: o.tipAmount || 0,
        items: o.items.map((item: any) => ({
          id: item.id,
          product: { name: item.product?.name || 'Item', image: item.product?.image || null },
          quantity: item.quantity,
          totalAmount: item.totalAmount
        }))
      }));

      return apiResponse(formatted, 'Order history fetched successfully');
    }

    return apiError(new Error('Invalid action parameter'), 400);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'update-location') {
      const { driverId, lat, lng } = body;
      if (!driverId || lat === undefined || lng === undefined) {
        return apiError(new Error('driverId, lat, and lng are required'), 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id: driverId },
        data: {
          deliveryLat: parseFloat(lat),
          deliveryLng: parseFloat(lng)
        }
      });

      return apiResponse(updatedUser, 'Driver location updated successfully');
    }

    if (action === 'update-duty') {
      const { driverId, status } = body;
      if (!driverId || !status) {
        return apiError(new Error('driverId and status are required'), 400);
      }
      const updatedUser = await prisma.user.update({
        where: { id: driverId },
        data: { wtStatus: status }
      });
      return apiResponse(updatedUser, 'Duty status updated successfully');
    }

    if (action === 'update-profile') {
      const { driverId, fullName, vehicleNumber, vehicleType, deliveryRadius, propertyId } = body;
      if (!driverId) {
        return apiError(new Error('driverId is required'), 400);
      }
      const dataToUpdate: any = {};
      if (fullName !== undefined) dataToUpdate.fullName = fullName.trim();
      if (vehicleNumber !== undefined) dataToUpdate.vehicleNumber = vehicleNumber.toUpperCase().trim();
      if (vehicleType !== undefined) dataToUpdate.vehicleType = vehicleType;
      if (deliveryRadius !== undefined) dataToUpdate.deliveryRadius = parseFloat(deliveryRadius) || 5.0;
      if (propertyId !== undefined) {
        dataToUpdate.propertyId = propertyId || null;
      }

      const updatedUser = await prisma.user.update({
        where: { id: driverId },
        data: dataToUpdate
      });

      const responsePayload = {
        id: updatedUser.id,
        name: updatedUser.fullName,
        phone: updatedUser.phone,
        email: updatedUser.email,
        vehicleNumber: updatedUser.vehicleNumber,
        vehicleType: updatedUser.vehicleType || 'BIKE',
        isActive: updatedUser.isActive,
        propertyId: updatedUser.propertyId,
        dutyStatus: updatedUser.wtStatus || 'offline',
        deliveryRadius: updatedUser.deliveryRadius || 5.0
      };

      return apiResponse(responsePayload, 'Profile updated successfully');
    }

    if (action === 'send-otp-email') {
      const { email, otp, fullName } = body;
      if (!email || !otp) {
        return apiError(new Error('email and otp are required'), 400);
      }

      const { sendMail } = require('@/lib/mail');
      const subject = `GuestFlow Rider Registration - Verification Code`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #0f172a; color: #f8fafc;">
          <h2 style="color: #f43f5e; text-align: center; margin-bottom: 5px;">GuestFlow Rider Portal</h2>
          <p style="text-align: center; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0;">Dual Active Dispatch</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
          <p>Hello <strong>${fullName || 'Delivery Rider'}</strong>,</p>
          <p>Thank you for initiating your rider onboarding with us. To verify your email address and proceed with registration, please use the following 4-digit verification code:</p>
          <div style="background-color: #1e293b; border: 1px solid #475569; text-align: center; padding: 15px; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #34d399; margin: 25px 0;">
            ${otp}
          </div>
          <p style="font-size: 11px; color: #94a3b8;">If you did not initiate this request, please disregard this email.</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="font-size: 10px; color: #64748b; text-align: center;">This is an automated security email from GuestFlow. Please do not reply directly.</p>
        </div>
      `;

      const sent = await sendMail({ to: email.trim(), subject, html });
      if (sent) {
        return apiResponse({ success: true }, 'Verification email dispatched successfully');
      } else {
        return apiError(new Error('Failed to dispatch verification email. Please check your admin SMTP settings.'), 500);
      }
    }

    if (action === 'signup') {
      const { fullName, phone, email, vehicleNumber, vehicleType, propertyId, password } = body;
      if (!fullName || (!phone && !email) || !vehicleNumber || !vehicleType || !password) {
        return apiError(new Error('Missing required fields: fullName, vehicleNumber, vehicleType, password, and either phone or email'), 400);
      }

      const cleanPhone = phone && phone.trim() ? phone.trim() : null;
      const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

      // Check if phone number is already registered if provided
      if (cleanPhone) {
        const existingPhone = await prisma.user.findFirst({
          where: { phone: cleanPhone }
        });
        if (existingPhone) {
          return apiError(new Error('A rider with this phone number is already registered'), 400);
        }
      }

      // Check if email is already registered if provided
      if (cleanEmail) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: cleanEmail }
        });
        if (existingEmail) {
          return apiError(new Error('A rider with this email address is already registered'), 400);
        }
      }

      // Find role
      let role = await prisma.role.findUnique({ where: { name: 'DELIVERY_RIDER' } });
      if (!role) {
        role = await prisma.role.create({
          data: { name: 'DELIVERY_RIDER', description: 'Delivery Rider' }
        });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password.trim(), 10);

      // Find default organization
      const firstOrg = await prisma.organization.findFirst();
      if (!firstOrg) {
        return apiError(new Error('No organization found in the database. Please set up the POS system first.'), 500);
      }

      // Create new user (isActive is false until Admin approves!)
      const newUser = await prisma.user.create({
        data: {
          fullName: fullName.trim(),
          email: cleanEmail ? cleanEmail : (cleanPhone ? `${cleanPhone}@delivery.com` : `driver-${Date.now()}@delivery.com`),
          phone: cleanPhone,
          passwordHash,
          organizationId: firstOrg.id,
          propertyId: propertyId || null,
          roleId: role.id,
          isActive: false, 
          onboardingCompleted: true,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          vehicleType: vehicleType,
          deliveryRadius: 5.0,
          wtStatus: 'online',
        }
      });

      const responsePayload = {
        id: newUser.id,
        name: newUser.fullName,
        phone: newUser.phone,
        email: newUser.email,
        vehicleNumber: newUser.vehicleNumber,
        vehicleType: newUser.vehicleType || 'BIKE',
        isActive: newUser.isActive,
        propertyId: newUser.propertyId,
        dutyStatus: newUser.wtStatus || 'online',
        deliveryRadius: newUser.deliveryRadius || 5.0
      };

      return apiResponse(responsePayload, 'Rider registered successfully!', 201);
    }

    if (action === 'accept-order') {
      const { orderId, driverId } = body;
      if (!orderId || !driverId) {
        return apiError(new Error('orderId and driverId are required to accept'), 400);
      }

      const order = await prisma.posOrder.findUnique({ where: { id: orderId } });
      if (!order) return apiError(new Error('Order not found'), 404);
      if (order.deliveryRiderId) return apiError(new Error('Order already claimed by another rider'), 400);

      const updated = await prisma.posOrder.update({
        where: { id: orderId },
        data: { deliveryRiderId: driverId }
      });
      return apiResponse(updated, 'Order accepted successfully!');
    }

    if (action === 'reject-order') {
      const { orderId, driverId } = body;
      return apiResponse({ success: true, orderId, driverId }, 'Order offer rejected.');
    }

    if (action === 'report-issue') {
      const { orderId, driverId, issueType, comments } = body;
      if (!orderId || !driverId || !issueType) {
        return apiError(new Error('orderId, driverId and issueType are required'), 400);
      }

      const order = await prisma.posOrder.findUnique({ where: { id: orderId } });
      if (order && order.propertyId) {
        try {
          await (prisma as any).notification.create({
            data: {
              propertyId: order.propertyId,
              title: `⚠️ Rider Order Issue`,
              message: `Order #${order.orderNo}: Issue reported: ${issueType}. Comments: ${comments || 'none'}`,
              type: 'ALERT',
              priority: 'HIGH',
              metadata: JSON.stringify({ orderId, driverId, issueType, comments })
            }
          });
        } catch (_) {}
      }
      return apiResponse({ success: true }, 'Issue reported to manager.');
    }

    if (action === 'confirm-contactless') {
      const { orderId, driverId, codAmountCollected, tipAmount, paymentMethod } = body;
      if (!orderId || !driverId) {
        return apiError(new Error('orderId and driverId are required'), 400);
      }

      const order = await prisma.posOrder.findUnique({ where: { id: orderId } });
      if (!order) return apiError(new Error('Order not found'), 404);

      const isCOD = !order.isPrepaid;
      const activePaymentMethod = isCOD ? (paymentMethod === 'UPI' ? 'UPI' : 'CASH') : null;

      const updated = await prisma.posOrder.update({
        where: { id: orderId },
        data: {
          status: 'SETTLED',
          codCollected: isCOD ? true : false,
          codAmountCollected: isCOD ? parseFloat(codAmountCollected ?? order.grandTotal) : 0,
          deliveryPaymentMethod: activePaymentMethod,
          tipAmount: parseFloat(tipAmount ?? 0),
          updatedAt: new Date()
        }
      });
      return apiResponse(updated, 'Contactless delivery confirmed.');
    }

    if (action === 'claim') {
      const { orderId, driverId } = body;
      if (!orderId || !driverId) {
        return apiError(new Error('orderId and driverId are required to claim'), 400);
      }

      const order = await prisma.posOrder.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return apiError(new Error('Order not found'), 404);
      }

      if (order.deliveryRiderId) {
        return apiError(new Error('Order already claimed by another rider'), 400);
      }

      const updatedOrder = await prisma.posOrder.update({
        where: { id: orderId },
        data: {
          deliveryRiderId: driverId
        }
      });

      return apiResponse(updatedOrder, 'Order claimed successfully!');
    }

    if (action === 'login') {
      const { phoneOrEmail, phone, password } = body;
      const lookup = (phoneOrEmail || phone || '').trim();
      if (!lookup) {
        return apiError(new Error('Mobile number or Email address is required'), 400);
      }
      if (!password) {
        return apiError(new Error('Password is required'), 400);
      }

      // Find the DELIVERY_RIDER user with this phone or email
      const riderUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: lookup },
            { email: lookup }
          ],
          role: { name: 'DELIVERY_RIDER' }
        }
      });

      if (!riderUser) {
        return apiError(new Error('Rider profile not found. Please verify your mobile number or email.'), 404);
      }

      if (!riderUser.isActive) {
        return apiError(new Error('Your rider account is pending Admin approval. Please contact management.'), 403);
      }

      // Verify password using bcrypt
      const bcrypt = require('bcryptjs');
      const isPasswordMatch = await bcrypt.compare(password, riderUser.passwordHash);
      if (!isPasswordMatch) {
        return apiError(new Error('Invalid password. Please try again.'), 400);
      }

      const responsePayload = {
        id: riderUser.id,
        name: riderUser.fullName,
        phone: riderUser.phone,
        email: riderUser.email,
        vehicleNumber: riderUser.vehicleNumber,
        vehicleType: riderUser.vehicleType || 'BIKE',
        isActive: riderUser.isActive,
        propertyId: riderUser.propertyId,
        dutyStatus: riderUser.wtStatus || 'offline',
        deliveryRadius: riderUser.deliveryRadius || 5.0
      };

      return apiResponse(responsePayload, 'Rider authenticated successfully!');
    }

    // ── mark-picked: Rider picked up the order → OUT_FOR_DELIVERY ──────────
    if (action === 'mark-picked') {
      const { orderId, driverId } = body;
      if (!orderId || !driverId) {
        return apiError(new Error('orderId and driverId are required'), 400);
      }

      const order = await prisma.posOrder.findUnique({ where: { id: orderId } });
      if (!order) return apiError(new Error('Order not found'), 404);
      if (order.deliveryRiderId !== driverId) {
        return apiError(new Error('This order is not assigned to this rider'), 400);
      }

      const updated = await prisma.posOrder.update({
        where: { id: orderId },
        data: { status: 'OUT_FOR_DELIVERY', updatedAt: new Date() }
      });

      // Notify manager
      try {
        await (prisma as any).notification.create({
          data: {
            propertyId: order.propertyId,
            title: '🛵 Order Picked Up',
            message: `Rider has picked up Order #${order.orderNo}. Now out for delivery.`,
            type: 'ORDER',
            priority: 'LOW',
            metadata: JSON.stringify({ orderId: order.id })
          }
        });
      } catch (_) {}

      return apiResponse(updated, 'Order marked as Out for Delivery!');
    }

    // ── earnings: Rider's today earnings summary ─────────────────────────────
    if (action === 'earnings') {
      const { driverId } = body;
      if (!driverId) return apiError(new Error('driverId is required'), 400);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const completedToday = await prisma.posOrder.findMany({
        where: {
          deliveryRiderId: driverId,
          status: 'SETTLED',
          updatedAt: { gte: todayStart }
        },
        select: {
          id: true,
          orderNo: true,
          grandTotal: true,
          deliveryCustomerName: true,
          updatedAt: true,
          isPrepaid: true,
          codCollected: true,
          codAmountCollected: true,
          deliveryPaymentMethod: true,
          tipAmount: true,
          riderHandoverId: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      const totalEarnings = completedToday.reduce((sum: number, o: any) => sum + (o.grandTotal || 0), 0);
      const totalCodCollected = completedToday.reduce((sum: number, o: any) => sum + (o.codCollected ? (o.codAmountCollected || 0) : 0), 0);
      const totalCashCollected = completedToday.reduce((sum: number, o: any) => sum + ((o.codCollected && o.deliveryPaymentMethod !== 'UPI') ? (o.codAmountCollected || 0) : 0), 0);
      const totalUpiCollected = completedToday.reduce((sum: number, o: any) => sum + ((o.codCollected && o.deliveryPaymentMethod === 'UPI') ? (o.codAmountCollected || 0) : 0), 0);
      const totalTipsLogged = completedToday.reduce((sum: number, o: any) => sum + (o.tipAmount || 0), 0);
      const outstandingCash = completedToday.reduce((sum: number, o: any) => sum + ((o.codCollected && o.deliveryPaymentMethod !== 'UPI' && !o.riderHandoverId) ? (o.codAmountCollected || 0) : 0), 0);

      const handovers = await prisma.riderCashHandover.findMany({
        where: { riderId: driverId },
        orderBy: { submittedAt: 'desc' },
        take: 20
      });

      const formattedHandovers = handovers.map((h: any) => ({
        id: h.id,
        date: h.submittedAt.toLocaleDateString('en-IN'),
        amount: h.reportedCash,
        status: h.status === 'PENDING' ? 'PENDING_APPROVAL' : h.status
      }));

      return apiResponse({
        trips: completedToday,
        totalTrips: completedToday.length,
        totalValue: totalEarnings,
        totalCodCollected,
        totalCashCollected,
        totalUpiCollected,
        totalTipsLogged,
        outstandingCash,
        handoverHistory: formattedHandovers,
        date: todayStart.toISOString().split('T')[0]
      }, 'Earnings fetched');
    }

    // ── sos: Rider sends SOS alert ────────────────────────────────────────────
    if (action === 'sos') {
      const { driverId, lat, lng } = body;
      if (!driverId) return apiError(new Error('driverId is required'), 400);

      const rider = await prisma.user.findUnique({
        where: { id: driverId },
        select: { fullName: true, phone: true, propertyId: true }
      });
      if (!rider) return apiError(new Error('Rider not found'), 404);

      const mapsLink = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : 'Location unavailable';

      if (rider.propertyId) {
        try {
          await (prisma as any).notification.create({
            data: {
              propertyId: rider.propertyId,
              title: '🚨 RIDER SOS ALERT',
              message: `Rider ${rider.fullName} (${rider.phone}) sent an SOS! Location: ${mapsLink}`,
              type: 'ALERT',
              priority: 'URGENT',
              metadata: JSON.stringify({ riderId: driverId, lat, lng, mapsLink })
            }
          });
        } catch (_) {}
      }

      return apiResponse({ sent: true }, 'SOS alert sent to manager!');
    }

    // ── cod-collected: Rider confirms cash collected from customer ────────────
    if (action === 'cod-collected') {
      const { orderId, driverId, amount, tip, paymentMethod } = body;
      if (!orderId || !driverId) {
        return apiError(new Error('orderId and driverId are required'), 400);
      }

      const order = await prisma.posOrder.findUnique({ where: { id: orderId } });
      if (!order) return apiError(new Error('Order not found'), 404);
      if (order.deliveryRiderId !== driverId) {
        return apiError(new Error('This order is not assigned to this rider'), 400);
      }

      const collectedAmount = parseFloat(amount || order.grandTotal);
      const tipValue = parseFloat(tip || 0);
      const activePaymentMethod = paymentMethod === 'UPI' ? 'UPI' : 'CASH';

      // Save collection in DB
      await prisma.posOrder.update({
        where: { id: orderId },
        data: {
          codCollected: true,
          codAmountCollected: collectedAmount,
          deliveryPaymentMethod: activePaymentMethod,
          tipAmount: tipValue,
        }
      });

      // Notify manager about COD collection
      if (order.propertyId) {
        try {
          await (prisma as any).notification.create({
            data: {
              propertyId: order.propertyId,
              title: activePaymentMethod === 'UPI' ? '📱 UPI Payment Received' : '💵 COD Collected',
              message: `Rider confirmed ${activePaymentMethod === 'UPI' ? 'UPI' : 'cash'} collection of ₹${collectedAmount} (Tip: ₹${tipValue}) for Order #${order.orderNo}.`,
              type: 'PAYMENT',
              priority: 'MEDIUM',
              metadata: JSON.stringify({ orderId: order.id, amount: collectedAmount, tip: tipValue, paymentMethod: activePaymentMethod })
            }
          });
        } catch (_) {}
      }

      return apiResponse({ logged: true, orderId, amount: collectedAmount, tip: tipValue }, 'COD collection logged!');
    }

    if (action === 'submit-handover') {
      const { driverId, amount } = body;
      if (!driverId) return apiError(new Error('driverId is required'), 400);

      const driver = await prisma.user.findUnique({ where: { id: driverId } });
      if (!driver) return apiError(new Error('Driver profile not found'), 404);
      if (!driver.propertyId) return apiError(new Error('Driver is not associated with any restaurant branch'), 400);

      // Fetch outstanding COD orders (only cash collections)
      const outstandingOrders = await prisma.posOrder.findMany({
        where: {
          deliveryRiderId: driverId,
          codCollected: true,
          deliveryPaymentMethod: { not: 'UPI' },
          riderHandoverId: null
        }
      });

      if (outstandingOrders.length === 0) {
        return apiError(new Error('No outstanding COD cash collection balance to hand over.'), 400);
      }

      const totalCodAmount = outstandingOrders.reduce((sum: number, o: any) => sum + (o.codAmountCollected || 0), 0);
      const totalTipAmount = outstandingOrders.reduce((sum: number, o: any) => sum + (o.tipAmount || 0), 0);
      const reportedCash = parseFloat(amount || totalCodAmount);

      const handover = await prisma.riderCashHandover.create({
        data: {
          riderId: driverId,
          propertyId: driver.propertyId,
          totalCodAmount,
          totalTipAmount,
          reportedCash,
          status: 'PENDING'
        }
      });

      // Link orders
      await prisma.posOrder.updateMany({
        where: { id: { in: outstandingOrders.map((o: any) => o.id) } },
        data: { riderHandoverId: handover.id }
      });

      // Notify manager
      try {
        await (prisma as any).notification.create({
          data: {
            propertyId: driver.propertyId,
            title: '💵 Cash Handover Submitted',
            message: `Rider ${driver.fullName} submitted ₹${reportedCash} for handover (Expected COD: ₹${totalCodAmount}, Tips: ₹${totalTipAmount}).`,
            type: 'PAYMENT',
            priority: 'HIGH',
            metadata: JSON.stringify({ handoverId: handover.id, driverId, reportedCash })
          }
        });
      } catch (_) {}

      return apiResponse(handover, 'Handover request logged successfully.');
    }

    if (action === 'add-tip') {
      const { orderId, driverId, tipAmount } = body;
      if (!orderId || !driverId || tipAmount === undefined) {
        return apiError(new Error('orderId, driverId and tipAmount are required'), 400);
      }

      const order = await prisma.posOrder.findFirst({
        where: {
          OR: [
            { id: orderId },
            { orderNo: orderId }
          ],
          deliveryRiderId: driverId
        }
      });

      if (!order) return apiError(new Error('Order not found or not assigned to this rider'), 404);

      const updated = await prisma.posOrder.update({
        where: { id: order.id },
        data: { tipAmount: parseFloat(tipAmount) }
      });

      return apiResponse(updated, 'Tip logged successfully');
    }


    const { orderId, driverId, otp } = body;

    if (!orderId || !driverId || !otp) {
      return apiError(new Error('Missing orderId, driverId or otp parameters'), 400);
    }

    // 1. Fetch order details
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return apiError(new Error('Order not found'), 404);
    }

    if (order.deliveryRiderId !== driverId) {
      return apiError(new Error('This order is not assigned to this rider'), 400);
    }

    // 2. Validate deterministic OTP
    const expectedOtp = getDeliveryOtp(order.id);
    if (otp.trim() !== expectedOtp) {
      return apiError(new Error('Invalid customer OTP. Please check and try again.'), 400);
    }

    // 3. Complete and settle order
    const isCOD = !order.isPrepaid;
    const activePaymentMethod = isCOD ? (body.paymentMethod === 'UPI' ? 'UPI' : 'CASH') : null;
    const updatedOrder = await prisma.posOrder.update({
      where: { id: orderId },
      data: {
        status: 'SETTLED',
        codCollected: isCOD ? true : false,
        codAmountCollected: isCOD ? parseFloat(body.codAmountCollected ?? order.grandTotal) : 0,
        deliveryPaymentMethod: activePaymentMethod,
        tipAmount: parseFloat(body.tipAmount ?? 0),
        updatedAt: new Date()
      }
    });

    return apiResponse(updatedOrder, 'Delivery verified and order completed successfully!');
  } catch (error) {
    return apiError(error);
  }
}
