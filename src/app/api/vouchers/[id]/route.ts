import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    const { id } = await params;
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        entries: {
          include: { account: { select: { id: true, name: true, accountType: true } } },
        },
      },
    });
    if (!voucher) return apiError(new Error('Voucher not found'), 404);
    return apiResponse(voucher, 'Voucher fetched');
  } catch (error) {
    return apiError(error);
  }
}
