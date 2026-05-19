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
        isActive: u.isActive
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
            in: ['IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL']
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
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
              in: ['IN_KITCHEN', 'READY', 'KOT_RUNNING']
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
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
              in: ['IN_KITCHEN', 'READY', 'KOT_RUNNING']
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
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

    return apiError(new Error('Invalid action parameter'), 400);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

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
      const { phone, vehicleNumber } = body;
      if (!phone || !vehicleNumber) {
        return apiError(new Error('Mobile number and Vehicle number are required'), 400);
      }

      // Find the active DELIVERY_RIDER user with this phone number
      const riderUser = await prisma.user.findFirst({
        where: {
          phone: phone.trim(),
          role: { name: 'DELIVERY_RIDER' },
          isActive: true
        }
      });

      if (!riderUser) {
        return apiError(new Error('Rider profile not found. Please verify your mobile number.'), 404);
      }

      // Check vehicleNumber case-insensitively
      const isPlateMatch = 
        riderUser.vehicleNumber && 
        riderUser.vehicleNumber.trim().toLowerCase() === vehicleNumber.trim().toLowerCase();

      if (!isPlateMatch) {
        return apiError(new Error('Invalid Vehicle number. Please try again.'), 400);
      }

      const responsePayload = {
        id: riderUser.id,
        name: riderUser.fullName,
        phone: riderUser.phone,
        vehicleNumber: riderUser.vehicleNumber,
        vehicleType: riderUser.vehicleType || 'BIKE',
        isActive: riderUser.isActive
      };

      return apiResponse(responsePayload, 'Rider authenticated successfully!');
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
    const updatedOrder = await prisma.posOrder.update({
      where: { id: orderId },
      data: {
        status: 'SETTLED',
        updatedAt: new Date()
      }
    });

    return apiResponse(updatedOrder, 'Delivery verified and order completed successfully!');
  } catch (error) {
    return apiError(error);
  }
}
