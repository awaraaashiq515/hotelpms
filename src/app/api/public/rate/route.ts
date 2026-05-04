import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyCode, qrToken, rating, comments } = body;

    if (!propertyCode || !qrToken || !rating) {
      return apiError(new Error('Missing required fields'), 400);
    }

    // Find the property and table
    const property = await prisma.property.findUnique({
      where: { code: propertyCode },
    });

    if (!property) {
      return apiError(new Error('Property not found'), 404);
    }

    const table = await prisma.table.findFirst({
      where: {
        propertyId: property.id,
        OR: [
          { qrToken: qrToken },
          { id: qrToken }
        ]
      },
    });

    if (!table) {
      return apiError(new Error('Table not found'), 404);
    }

    // Save the feedback
    const feedback = await prisma.tableFeedback.create({
      data: {
        propertyId: property.id,
        tableId: table.id,
        rating: Number(rating),
        comments: comments || '',
      },
    });

    return apiResponse(feedback, 'Thank you for your feedback!');
  } catch (error: any) {
    console.error('Feedback Error:', error);
    return apiError(error, 500);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyCode = searchParams.get('propertyCode');
  const qrToken = searchParams.get('qrToken');

  if (!propertyCode || !qrToken) {
    return apiError(new Error('Missing propertyCode or qrToken'), 400);
  }

  try {
    const property = await prisma.property.findUnique({
      where: { code: propertyCode },
      select: { id: true, name: true, brandName: true, logoUrl: true }
    });

    if (!property) return apiError(new Error('Property not found'), 404);

    const table = await prisma.table.findFirst({
      where: {
        propertyId: property.id,
        OR: [
          { qrToken: qrToken },
          { id: qrToken }
        ]
      },
      select: { id: true, name: true }
    });

    if (!table) return apiError(new Error('Table not found'), 404);

    return apiResponse({ property, table });
  } catch (error: any) {
    return apiError(error, 500);
  }
}
