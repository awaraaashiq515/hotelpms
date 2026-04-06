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
  console.error('[API Error]:', error)

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validation failed',
        error: error.issues,
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

  const finalMessage = error instanceof Error ? error.message : message;

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
    if (propertyIdParam && propertyIdParam !== 'all' && propertyIdParam !== 'null') {
      return { propertyId: propertyIdParam };
    }
    return {};
  }

  // 2. ADMIN: Organization-wide visibility by default
  if (role === 'RESTAURANTS_ADMIN') {
    if (!organizationId) {
      console.warn('[Security] Admin session missing organizationId. Restricted to home property.');
      return sessionPropId ? { propertyId: sessionPropId } : { propertyId: 'none' };
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

