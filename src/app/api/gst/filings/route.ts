import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET — All past filings for this property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiResponse([], 'No filings found');

    const filings = await prisma.gstFiling.findMany({
      where: { propertyId },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        filingMonth: true,
        returnType: true,
        status: true,
        totalTaxable: true,
        totalCgst: true,
        totalSgst: true,
        totalIgst: true,
        totalAmount: true,
        invoiceCount: true,
        generatedAt: true,
        submittedAt: true,
        notes: true,
        // Don't send full jsonData in list — too large
      }
    });

    return apiResponse(filings, 'GST filings fetched successfully');
  } catch (error) {
    console.error('GST Filings GET Error:', error);
    return apiError(error);
  }
}

// DELETE — Delete a draft filing
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiError(new Error('Filing ID is required'), 400);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property found'), 404);

    const filing = await prisma.gstFiling.findFirst({
      where: { id, propertyId, status: 'DRAFT' }
    });
    if (!filing) return apiError(new Error('Draft filing not found'), 404);

    await prisma.gstFiling.delete({ where: { id } });

    return apiResponse(null, 'Filing deleted');
  } catch (error) {
    console.error('GST Filings DELETE Error:', error);
    return apiError(error);
  }
}

// PATCH — Mark a filing as SUBMITTED
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, notes } = body;
    if (!id) return apiError(new Error('Filing ID is required'), 400);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property found'), 404);

    const filing = await prisma.gstFiling.findFirst({
      where: { id, propertyId }
    });
    if (!filing) return apiError(new Error('Filing not found'), 404);

    const updated = await prisma.gstFiling.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), notes: notes || filing.notes }
    });

    return apiResponse(updated, 'Filing marked as submitted');
  } catch (error) {
    console.error('GST Filings PATCH Error:', error);
    return apiError(error);
  }
}
