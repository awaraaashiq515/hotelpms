import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

// POST: Public endpoint — place an order from a QR scan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) return apiError(new Error('Token required'), 400);

    // Validate supplier
    const supplier = await prisma.b2BSupplier.findUnique({
      where: { qrToken: token },
      select: { id: true, qrEnabled: true, name: true },
    });

    if (!supplier) return apiError(new Error('Invalid QR code'), 404);
    if (!supplier.qrEnabled) return apiError(new Error('QR ordering is disabled'), 403);

    const body = await request.json();
    const { buyerName, buyerPhone, buyerRestaurant, buyerAddress, items } = body;

    // Validate required fields
    if (!buyerName || !buyerPhone) {
      return apiError(new Error('Name and phone are required'), 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiError(new Error('At least one item is required'), 400);
    }

    // Validate each item and compute totals
    let totalAmount = 0;
    const validatedItems: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    for (const item of items) {
      const product = await prisma.b2BProduct.findFirst({
        where: { id: item.productId, supplierId: supplier.id },
        select: { id: true, price: true, discount: true, stockQuantity: true, name: true },
      });

      if (!product) continue;

      const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
      const itemTotal = discountedPrice * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: discountedPrice,
        totalPrice: itemTotal,
      });
    }

    if (validatedItems.length === 0) {
      return apiError(new Error('No valid items found'), 400);
    }

    // Generate order number
    const orderNo = `QR-${supplier.id.slice(-4).toUpperCase()}-${Date.now()}`;

    // Create the order
    const order = await prisma.b2BOrder.create({
      data: {
        supplierId: supplier.id,
        propertyId: null, // QR order — no platform property
        orderNo,
        totalAmount,
        orderSource: 'QR_SCAN',
        buyerName,
        buyerPhone,
        buyerRestaurant: buyerRestaurant || null,
        status: 'PENDING',
        items: {
          create: validatedItems,
        },
      },
      select: {
        id: true,
        orderNo: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    return apiResponse(
      { order, supplierName: supplier.name },
      'Order placed successfully',
      201
    );
  } catch (error) {
    return apiError(error);
  }
}
