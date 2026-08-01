import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property context found.'), 400);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        whatsAppEnabled: true,
        whatsAppProvider: true,
        whatsAppApiKey: true,
        whatsAppInstanceId: true,
        whatsAppTemplate: true,
        metaAccessToken: true,
        metaPhoneId: true,
      },
    });

    if (!property) return apiError(new Error('Property not found.'), 404);

    return apiResponse({
      whatsAppEnabled: property.whatsAppEnabled,
      whatsAppProvider: property.whatsAppProvider || 'AUTHKEY',
      whatsAppApiKey: property.whatsAppApiKey || '',
      whatsAppInstanceId: property.whatsAppInstanceId || '',
      whatsAppTemplate: property.whatsAppTemplate || 'guest_booking_confirmation',
      metaAccessToken: property.metaAccessToken || '',
      metaPhoneId: property.metaPhoneId || '',
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property context found.'), 400);

    const body = await request.json();
    const {
      whatsAppEnabled,
      whatsAppProvider,
      whatsAppApiKey,
      whatsAppInstanceId,
      whatsAppTemplate,
      metaAccessToken,
      metaPhoneId,
    } = body;

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(whatsAppEnabled !== undefined && { whatsAppEnabled }),
        ...(whatsAppProvider !== undefined && { whatsAppProvider }),
        ...(whatsAppApiKey !== undefined && { whatsAppApiKey }),
        ...(whatsAppInstanceId !== undefined && { whatsAppInstanceId }),
        ...(whatsAppTemplate !== undefined && { whatsAppTemplate }),
        ...(metaAccessToken !== undefined && { metaAccessToken }),
        ...(metaPhoneId !== undefined && { metaPhoneId }),
      },
      select: {
        whatsAppEnabled: true,
        whatsAppProvider: true,
        whatsAppApiKey: true,
      },
    });

    return apiResponse(updated, 'WhatsApp settings saved successfully');
  } catch (error) {
    return apiError(error);
  }
}
