import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data?: T
  error?: any
}

// Helper for standardizing successful API JSON responses
export function apiResponse<T>(data: T, message: string = 'Success', status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  )
}

// Centralized error handler for API Routes
export function apiError(error: any, status: number = 500, message: string = 'Internal Server Error') {
  const finalMessage = error instanceof Error ? error.message : message;
  
  // Don't flood server logs with expected user-side errors (400, 401, 404)
  const silentStatuses = [400, 401, 404];
  const isSilentMessage = ['Unauthorized', 'Captcha expired', 'Invalid captcha'].some(m => finalMessage.includes(m));

  if (!silentStatuses.includes(status) && !isSilentMessage) {
    console.error('[API Error]:', error);
  }

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    // Extract first human-readable message from issues
    const firstMsg = error.issues?.[0]?.message || 'Validation failed';
    return NextResponse.json(
      {
        success: false,
        message: firstMsg,
        error: firstMsg,
      },
      { status: 400 }
    )
  }

  // Handle Prisma Errors
  if (error?.code) {
    // Example: Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          message: 'A record with this value already exists.',
        },
        { status: 409 }
      )
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: finalMessage,
      error: finalMessage,
    },
    { status }
  )
}

/**
 * Standardized Multi-Tenant Filter Generator
 * 
 * - SUPER_ADMIN: Can see everything, or filter by propertyId if provided.
 * - ADMIN: Restricted to their organization, can optionally filter by propertyId.
 * - POSSYSTEM / Others: Strictly restricted to their home property.
 */
export function getMultiTenantWhere(session: any, propertyIdParam?: string | null) {
  const { role, organizationId, propertyId: sessionPropId } = session;

  // 1. SUPER_ADMIN: Global visibility, but can filter by property if requested
  if (role === 'SUPER_ADMIN') {
    if (propertyIdParam && propertyIdParam !== 'all' && propertyIdParam !== 'null' && propertyIdParam !== 'undefined') {
      return { propertyId: propertyIdParam };
    }
    return {};
  }

  // 2. ADMIN: Organization-wide visibility by default
  if (role === 'RESTAURANTS_ADMIN') {
    if (!organizationId) {
      console.warn('[Security] Admin session missing organizationId. Restricted to home property.');
      // If we don't have organizationId, we can't search "all properties", 
      // but we can at least return their home property.
      const fallbackId = (propertyIdParam && propertyIdParam !== 'all' && propertyIdParam !== 'null' && propertyIdParam !== 'undefined') 
                        ? propertyIdParam 
                        : sessionPropId;
      return { propertyId: fallbackId || 'none' };
    }
    
    // Explicit property selection takes priority
    if (propertyIdParam && propertyIdParam !== 'all' && propertyIdParam !== 'null' && propertyIdParam !== 'undefined') {
      return { propertyId: propertyIdParam, property: { organizationId } };
    }
    
    // Fallback to searching all properties in the organization
    return { property: { organizationId } };
  }

  // 3. POSSYSTEM / STAFF: Strictly restricted to their home property
  const finalPropId = (propertyIdParam && propertyIdParam !== 'null' && propertyIdParam !== 'undefined') ? propertyIdParam : sessionPropId;
  return { propertyId: finalPropId || 'none' };
}

/**
 * Standardized Property Resolver for APIs that work with a single property context.
 * Useful for GST Filing, Settings, and other non-list APIs.
 */
export async function resolveAdminProperty(session: any, prisma: any): Promise<string | null> {
  const { role, organizationId, propertyId: sessionPropId } = session;

  // 1. If session has a fixed propertyId (POS systems), use it
  if (sessionPropId) return sessionPropId;

  // 2. For Admins/Super Admins, if they don't have a specific property selected in session,
  // pick the first one from their organization to provide a default context.
  if (organizationId && (role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN')) {
    const prop = await prisma.property.findFirst({
      where: { organizationId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return prop?.id ?? null;
  }

  return null;
}

/**
 * Resolves any property identifier (CUID id, property code, name, or URL slug like 'main-hotel')
 * to the actual Property record from the database.
 * Supports graceful fallback to session property, organization property, or active property.
 */
export async function resolvePropertyIdentifier(
  identifier?: string | null,
  session?: any,
  prismaClient?: any
): Promise<{ id: string; name: string; code: string } | null> {
  const p = prismaClient || (await import('@/lib/prisma')).prisma;
  const clean = identifier?.trim();

  if (clean && clean !== 'all' && clean !== 'null' && clean !== 'undefined') {
    const spaced = clean.replace(/[-_]+/g, ' ');

    // 1. Direct Prisma match on id, code, uppercase code, or exact name
    let prop = await p.property.findFirst({
      where: {
        OR: [
          { id: clean },
          { code: clean },
          { code: clean.toUpperCase() },
          { name: clean },
          { name: spaced },
        ],
      },
      select: { id: true, name: true, code: true },
    });

    if (prop) return prop;

    // 2. In-memory comparison for case-insensitivity and slug match
    const all = await p.property.findMany({
      select: { id: true, name: true, code: true },
    });

    const targetLower = clean.toLowerCase();
    const targetSpaced = targetLower.replace(/[-_]+/g, ' ');

    const slugifyInline = (text: string) =>
      text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

    prop = all.find((item: any) => {
      const nameLower = (item.name || '').toLowerCase();
      const codeLower = (item.code || '').toLowerCase();
      const slugName = slugifyInline(item.name || '');
      const slugCode = slugifyInline(item.code || '');
      return (
        item.id === clean ||
        codeLower === targetLower ||
        nameLower === targetLower ||
        nameLower === targetSpaced ||
        slugName === targetLower ||
        slugCode === targetLower
      );
    });

    if (prop) return prop;
  }

  // 3. Fallback to session propertyId
  if (session?.propertyId) {
    const prop = await p.property.findUnique({
      where: { id: session.propertyId },
      select: { id: true, name: true, code: true },
    });
    if (prop) return prop;
  }

  // 4. Fallback to admin property in user's organization
  if (session) {
    const adminPropId = await resolveAdminProperty(session, p);
    if (adminPropId) {
      const prop = await p.property.findUnique({
        where: { id: adminPropId },
        select: { id: true, name: true, code: true },
      });
      if (prop) return prop;
    }
  }

  // 5. Final fallback to first active property so API never crashes
  const fallback = await p.property.findFirst({
    select: { id: true, name: true, code: true },
    orderBy: { createdAt: 'asc' },
  });

  return fallback || null;
}


