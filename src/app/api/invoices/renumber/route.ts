import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { renumberInvoices } from '@/lib/invoice-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    await prisma.$transaction(async (tx) => {
      await renumberInvoices(session.propertyId!, tx);
    }, { timeout: 60000 });

    return apiResponse(null, 'Invoices renumbered successfully');
  } catch (error) {
    console.error('Renumbering error:', error);
    return apiError(error);
  }
}
