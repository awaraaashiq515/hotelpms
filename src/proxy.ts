import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod'
const key = new TextEncoder().encode(secretKey)

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl
  
  const isDashboardRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/billing') || 
                           pathname.startsWith('/invoices') || 
                           pathname.startsWith('/payments') || 
                           pathname.startsWith('/inventory') || 
                           pathname.startsWith('/kots') || 
                           pathname.startsWith('/reports') || 
                           pathname.startsWith('/settings') || 
                           pathname.startsWith('/operations') ||
                           pathname.startsWith('/drivers') ||
                           pathname.startsWith('/pos-staff') ||
                           pathname.startsWith('/expenses') ||
                           pathname.startsWith('/accounts') ||
                           pathname.startsWith('/manage-properties') ||
                           pathname.startsWith('/manage-users') ||
                           pathname.startsWith('/manage-roles') ||
                           pathname.startsWith('/pos/gst-filing') ||
                           pathname.startsWith('/pos/gst-settings') ||
                           pathname.startsWith('/vouchers') ||
                           pathname.startsWith('/orders') ||
                           pathname.startsWith('/all-bills') ||
                           pathname.startsWith('/categories') ||
                           pathname.startsWith('/products') ||
                           pathname.startsWith('/day-closing') ||
                           pathname.startsWith('/table-reservations')
  
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isExpiredPage = pathname === '/expired'

  // Verify JWT once and reuse payload
  let payload: any = null
  if (sessionCookie) {
    try {
      const verified = await jwtVerify(sessionCookie, key)
      payload = verified.payload
    } catch (err) {
      // If token is invalid for a protected route, redirect to login
      if (isDashboardRoute || isAdminRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  // 1. Subscription Expiry Check (Hard Enforcement)
  if (payload && isDashboardRoute && !isAdminRoute && !isExpiredPage) {
    const packageEndDate = payload.packageEndDate as string | null
    const role = payload.role as string

    if (role !== 'SUPER_ADMIN' && packageEndDate) {
      const expiryDate = new Date(packageEndDate)
      if (new Date() > expiryDate) {
        // Account Expired!
        return NextResponse.redirect(new URL('/expired', request.url))
      }
    }
  }

  // Role based access control
  if (payload) {
    const role = payload.role as string
    const onboardingCompleted = payload.onboardingCompleted as boolean

    // Onboarding is now disabled/skipped by default in the new provisioning model
    if (pathname === '/onboarding') {
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      if (role === 'RESTAURANTS_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/operations', request.url))
    }

    // Redirection for Auth Routes (if logged in)
    if (isAuthRoute) {
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      if (role === 'RESTAURANTS_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/operations', request.url))
    }

    // Admin Route Access (SUPER_ADMIN or ADMIN)
    if (isAdminRoute) {
      if (role !== 'SUPER_ADMIN' && role !== 'RESTAURANTS_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Dashboard/Operations Route Access
    if (isDashboardRoute) {
      // Permissions-based Access Control for non-admins
      if (role !== 'SUPER_ADMIN' && role !== 'RESTAURANTS_ADMIN') {
        // Hard block for property management and dashboard for non-admins
        if (pathname === '/manage-properties' || pathname.startsWith('/manage-properties/')) {
          return NextResponse.redirect(new URL('/operations', request.url));
        }
        if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
           return NextResponse.redirect(new URL('/operations', request.url));
        }
        if (pathname === '/all-bills' || pathname.startsWith('/all-bills/')) {
           return NextResponse.redirect(new URL('/operations', request.url));
        }
        // Payments allowed for POSSYSTEM now


        const permissions = (payload.permissions as string[] || []).map((p: string) => p.toLowerCase());
        
        // Map of protected paths to their required module permissions
        const pathPermissionMap: Record<string, string> = {
          '/dashboard': 'dashboard',
          '/manage-properties': 'businesses',
          '/manage-users': 'pos access',
          '/manage-roles': 'role management',
          '/inventory': 'inventory',
          '/expenses': 'expenses',
          '/accounts': 'accounting',
          '/reports': 'reports',
          '/settings': 'settings',
          '/invoices': 'invoices',
          '/payments': 'payments',
          '/pos-staff': 'pos staff',
          '/billing': 'pos terminal',
          '/kots': 'kots',
          '/kitchen-display': 'kitchen display',
          '/day-closing': 'day closing',
          '/operations/tables': 'table layout',
          '/operations/occupancy': 'live occupancy',
          '/table-reservations': 'table bookings',
          '/drivers': 'drivers',
          '/pos/gst-filing': 'gst filing',
          '/pos/gst-settings': 'gst filing',
        };

        // Find if the current path requires a permission
        const matchedPath = Object.keys(pathPermissionMap).find(p => pathname === p || pathname.startsWith(p + '/'));
        
        if (matchedPath) {
          const requiredPerm = pathPermissionMap[matchedPath];
          
          // Special bypass for POSSYSTEM role for standard POS modules
          const isStandardPosPath = ['/payments', '/invoices', '/billing', '/kots', '/inventory', '/products', '/categories', '/pos/gst-filing', '/pos/gst-settings'].some(p => pathname.startsWith(p));
          const shouldBypass = role === 'POSSYSTEM' && isStandardPosPath;

          if (!permissions.includes(requiredPerm) && !shouldBypass) {
            // Redirect unauthorized users to operations (landing page for POS)
            if (pathname !== '/operations') {
               return NextResponse.redirect(new URL('/operations', request.url));
            }
          }
        }
      }
    }
  }

  // Hard route enforcement for Package Features
  if (payload && !isAdminRoute && isDashboardRoute) {
    const role = payload.role as string
    const packageFeatures = (payload.packageFeatures as string[] || [])

    if (role !== 'SUPER_ADMIN' && role !== 'RESTAURANTS_ADMIN') {
      const pathToFeatureMap: Record<string, string> = {
        '/billing': 'POS',
        '/all-bills': 'POS',
        '/products': 'POS',
        '/categories': 'POS',
        '/inventory': 'INVENTORY',
        '/invoices': 'POS',
        '/payments': 'POS',
        '/expenses': 'ACCOUNTING',
        '/accounts': 'ACCOUNTING',
        '/vouchers': 'ACCOUNTING',
        '/reports': 'REPORTS',
        '/pos/gst-filing': 'GST',
        '/pos/gst-settings': 'GST',
        '/drivers': 'DRIVERS',
        '/pos-staff': 'STAFF',
        '/operations/tables': 'TABLES',
        '/table-reservations': 'TABLES',
      };

      const matchedPath = Object.keys(pathToFeatureMap).find(p => pathname === p || pathname.startsWith(p + '/'));
      if (matchedPath) {
        const requiredFeature = pathToFeatureMap[matchedPath];
        if (!packageFeatures.includes(requiredFeature)) {
          // Redirect unauthorized users to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
  }

  // Forward package features in response headers for client-side soft gating
  const response = NextResponse.next()
  if (payload) {
    const packageFeatures = payload.packageFeatures as string[] | undefined
    const discountPercent = payload.discountPercent as number | undefined
    if (packageFeatures && packageFeatures.length > 0) {
      response.headers.set('x-package-features', packageFeatures.join(','))
    }
    if (discountPercent !== undefined) {
      response.headers.set('x-package-discount', String(discountPercent))
    }
  }

  return response
}


// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - downloads (application downloads)
     * - icon-192.png, icon-512.png, manifest.json, etc.
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|downloads|manifest.json|icon-.*\\.png|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|exe|dmg|zip)).*)',
  ],
}
