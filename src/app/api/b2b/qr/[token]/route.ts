import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

// GET: Public endpoint — fetch supplier info + products by QR token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) return apiError(new Error('Token required'), 400);

    const supplier = await prisma.b2BSupplier.findUnique({
      where: { qrToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        category: true,
        qrEnabled: true,
        products: {
          where: { },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            unit: true,
            stockQuantity: true,
            discount: true,
            gstRate: true,
            image: true,
            category: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!supplier) return apiError(new Error('Invalid QR code or supplier not found'), 404);
    if (!supplier.qrEnabled) {
      return apiError(new Error('This supplier has disabled QR ordering'), 403);
    }

    return apiResponse(supplier, 'Supplier catalog loaded');
  } catch (error) {
    return apiError(error);
  }
}
