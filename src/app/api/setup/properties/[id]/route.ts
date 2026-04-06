import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    console.log('--- Property Update Start ---');
    console.log('Session PropertyID:', session?.propertyId);
    console.log('Target PropertyID [params.id]:', id);

    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    console.log('Incoming Payload:', body);
    const { name, brandName, logoUrl, city, state, country, address, phone, taxDetails } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (brandName !== undefined) updateData.brandName = brandName;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (taxDetails !== undefined) updateData.taxDetails = taxDetails;

    console.log('Processed Update Data:', updateData);

    // Using Raw SQL as a robust fallback because of Next.js/Turbopack Prisma client caching issues
    // We confirmed via sqlite3 that these columns exist.
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length > 0) {
      const setClause = fields.map((f, i) => `"${f}" = ?`).join(', ');
      const sql = `UPDATE "Property" SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`;
      await (prisma as any).$executeRawUnsafe(sql, ...values, id);
    }

    const property = await prisma.property.findUnique({ where: { id } });

    return apiResponse(property, 'Branding settings updated successfully');
  } catch (error: any) {
    console.error('Property update error [ID:', id, ']:', error);
    // Log the actual error stack if available
    if (error.stack) {
      console.log('Error Name:', error.name);
      console.log('Error Message:', error.message);
      console.log('Full Stack:', error.stack);
    }
    return apiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) return apiError(new Error('Property not found'), 404);

    return apiResponse(property);
  } catch (error) {
    return apiError(error);
  }
}
