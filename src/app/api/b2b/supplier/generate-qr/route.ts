import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// Generate a cryptographically safe random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST: Generate or regenerate QR token for a supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json().catch(() => ({}));
    const { supplierId, regenerate } = body;

    if (!supplierId) return apiError(new Error('supplierId required'), 400);

    // Get current supplier
    const supplier = await prisma.b2BSupplier.findUnique({
      where: { id: supplierId },
      select: { id: true, qrToken: true, qrEnabled: true },
    });

    if (!supplier) return apiError(new Error('Supplier not found'), 404);

    // Only generate new token if: no token exists, or regenerate requested
    let token = supplier.qrToken;
    if (!token || regenerate) {
      // Ensure uniqueness
      let unique = false;
      while (!unique) {
        token = generateToken();
        const existing = await prisma.b2BSupplier.findUnique({ where: { qrToken: token } });
        if (!existing) unique = true;
      }

      await prisma.b2BSupplier.update({
        where: { id: supplierId },
        data: { qrToken: token },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const orderUrl = `${baseUrl}/order/${token}`;

    return apiResponse({ token, orderUrl }, 'QR token ready');
  } catch (error) {
    return apiError(error);
  }
}

// PATCH: Toggle QR on/off
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { supplierId, qrEnabled } = await request.json();
    if (!supplierId) return apiError(new Error('supplierId required'), 400);

    const updated = await prisma.b2BSupplier.update({
      where: { id: supplierId },
      data: { qrEnabled: Boolean(qrEnabled) },
      select: { qrEnabled: true },
    });

    return apiResponse(updated, `QR ordering ${updated.qrEnabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    return apiError(error);
  }
}
