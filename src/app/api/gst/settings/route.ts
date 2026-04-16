import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET — Property ki current GST settings fetch karo
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property found for this account'), 404);

    const property = await prisma.property.findFirst({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        brandName: true,
        stateCode: true,
        taxDetails: true,
        organization: {
          select: {
            gstNumber: true,
            legalName: true,
            name: true,
          }
        }
      }
    });

    if (!property) return apiError(new Error('Property not found'), 404);

    // Parse taxDetails JSON for HSN defaults
    let hsnDefaults: Record<string, any> = {};
    try {
      const td = JSON.parse(property.taxDetails || '{}');
      hsnDefaults = td.hsnDefaults || {};
    } catch {}

    return apiResponse({
      propertyId: property.id,
      propertyName: property.brandName || property.name,
      gstin: property.organization?.gstNumber || '',
      legalName: property.organization?.legalName || property.organization?.name || '',
      stateCode: property.stateCode || '',
      hsnDefaults,
    }, 'GST settings fetched successfully');

  } catch (error) {
    console.error('GST Settings GET Error:', error);
    return apiError(error);
  }
}

// PATCH — GST settings update karo
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { gstin, legalName, stateCode, hsnDefaults } = body;

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property found'), 404);

    const property = await prisma.property.findFirst({
      where: { id: propertyId },
      select: { id: true, taxDetails: true, organizationId: true }
    });
    if (!property) return apiError(new Error('Property not found'), 404);

    let existingTaxDetails: Record<string, any> = {};
    try {
      existingTaxDetails = JSON.parse(property.taxDetails || '{}');
    } catch {}

    const updatedTaxDetails = {
      ...existingTaxDetails,
      hsnDefaults: hsnDefaults || existingTaxDetails.hsnDefaults || {},
    };

    // Update property
    await prisma.property.update({
      where: { id: property.id },
      data: {
        stateCode: stateCode || undefined,
        taxDetails: JSON.stringify(updatedTaxDetails),
      }
    });

    // Update Organization: gstin + legalName
    if (gstin || legalName) {
      await prisma.organization.update({
        where: { id: property.organizationId },
        data: {
          ...(gstin && { gstNumber: gstin }),
          ...(legalName && { legalName }),
        }
      });
    }

    return apiResponse(null, 'GST settings updated successfully');
  } catch (error) {
    console.error('GST Settings PATCH Error:', error);
    return apiError(error);
  }
}
