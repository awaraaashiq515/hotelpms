import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod'
const key = new TextEncoder().encode(secretKey)

/**
 * Next.js 16 middleware.
 * Handles auth, paywalls, subscription expiry, dynamic slug routing,
 * and role/permission-based access control.
 */
export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  
  const parts = pathname.split('/').filter(Boolean)
  const dashboardRoots = [
    'dashboard', 'billing', 'bar-pos', 'counter-payments', 'invoices', 'payments',
    'inventory', 'kots', 'reports', 'settings', 'operations', 'drivers', 'pos-staff',
    'expenses', 'accounts', 'manage-properties', 'manage-users', 'manage-roles',
    'pos', 'vouchers', 'orders', 'all-bills', 'categories', 'products', 'day-closing',
    'table-reservations', 'memberships', 'customers', 'b2b', 'kitchen-display', 'bar-display'
  ]

  let strippedPathname = pathname
  let hasPropertyCode = false

  // staff-portal is a standalone portal — skip all dashboard auth logic
  if (pathname.startsWith('/staff-portal')) {
    return NextResponse.next()
  }

  if (parts.length > 0 && !['admin', 'restaurantadmin', 'login', 'register', 'expired', 'payment-pending', 'api', '_next', 'images', 'downloads', 'driver-portal', 'staff-portal'].includes(parts[0])) {
    if (dashboardRoots.includes(parts[0])) {
      // Legacy access without propertyCode
      strippedPathname = pathname
    } else {
      hasPropertyCode = true
      strippedPathname = '/' + parts.slice(1).join('/')
    }
  }

  const isDashboardRoute = dashboardRoots.some(root => strippedPathname === `/${root}` || strippedPathname.startsWith(`/${root}/`))
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
      if (isDashboardRoute || isAdminRoute || pathname === '/payment-pending' || pathname.startsWith('/restaurantadmin')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  } else {
    // No session cookie and trying to access a protected route
    if (isDashboardRoute || isAdminRoute || pathname === '/payment-pending' || pathname.startsWith('/restaurantadmin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  
  const getOperationsUrl = () => {
    const urlKey = payload?.propertySlug || payload?.propertyCode
    return urlKey ? `/${urlKey}/operations` : '/operations'
  }

  // ── Helper: build the branded dashboard URL from the current session ──
  const getBrandedDashboardUrl = (): string => {
    const slug = payload?.organizationSlug as string | null
    if (slug) return `/restaurantadmin/${slug}`
    // Fallback: derive slug from organizationName if slug not yet in token
    const orgName = payload?.organizationName as string | null
    if (orgName) {
      const derived = orgName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      if (derived) return `/restaurantadmin/${derived}`
    }
    return '/dashboard'
  }

  // Paywall Lock for PENDING_PAYMENT / PENDING_APPROVAL
  if (payload) {
    // ── Internal rewrite for branded restaurantadmin routes ──
    if (pathname.startsWith('/restaurantadmin/') || pathname === '/restaurantadmin') {
      const urlKey = payload.propertySlug || payload.propertyCode
      if (urlKey) {
        return NextResponse.rewrite(new URL(`/${urlKey}${pathname}`, request.url))
      }
    }

    if (isDashboardRoute && !hasPropertyCode && payload.propertyCode) {
      const urlKey = payload.propertySlug || payload.propertyCode
      return NextResponse.redirect(new URL(`/${urlKey}${pathname}`, request.url))
    }

    const role = payload.role as string
    const status = payload.subscriptionStatus as string | null

    if (role !== 'SUPER_ADMIN') {
      if (status === 'PENDING_PAYMENT' || status === 'PENDING_APPROVAL') {
        if (pathname !== '/payment-pending') {
          return NextResponse.redirect(new URL('/payment-pending', request.url))
        }
      } else {
        if (pathname === '/payment-pending') {
          if (role === 'RESTAURANTS_ADMIN') {
            return NextResponse.redirect(new URL(getBrandedDashboardUrl(), request.url))
          }
          return NextResponse.redirect(new URL(getOperationsUrl(), request.url))
        }
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
        return NextResponse.redirect(new URL('/expired', request.url))
      }
    }
  }

  // Role based access control
  if (payload) {
    const role = payload.role as string

    // Onboarding is now disabled/skipped by default in the new provisioning model
    if (pathname === '/onboarding') {
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      if (role === 'RESTAURANTS_ADMIN') {
        return NextResponse.redirect(new URL(getBrandedDashboardUrl(), request.url))
      }
      return NextResponse.redirect(new URL(getOperationsUrl(), request.url))
    }

    // Redirection for Auth Routes (if logged in, bypass login page)
    if (isAuthRoute) {
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      if (role === 'RESTAURANTS_ADMIN') {
        return NextResponse.redirect(new URL(getBrandedDashboardUrl(), request.url))
      }
      return NextResponse.redirect(new URL(getOperationsUrl(), request.url))
    }

    // ── Dynamic /dashboard → /restaurantadmin/[slug] redirect ──
    if ((pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && role === 'RESTAURANTS_ADMIN') {
      const brandedUrl = getBrandedDashboardUrl()
      // Only redirect if we can build a proper slug URL to prevent infinite loop
      if (brandedUrl !== '/dashboard') {
        return NextResponse.redirect(new URL(brandedUrl, request.url))
      }
    }

    // Admin Route Access (SUPER_ADMIN or RESTAURANTS_ADMIN)
    if (isAdminRoute) {
      if (role !== 'SUPER_ADMIN' && role !== 'RESTAURANTS_ADMIN') {
        return NextResponse.redirect(new URL(getBrandedDashboardUrl(), request.url))
      }
    }

    // Dashboard/Operations Route Access
    if (isDashboardRoute) {
      // Permissions-based Access Control for non-admins
      if (role !== 'SUPER_ADMIN' && role !== 'RESTAURANTS_ADMIN') {
        // Hard block for property management and restaurant admin path for non-admins
        if (pathname === '/manage-properties' || pathname.startsWith('/manage-properties/')) {
          return NextResponse.redirect(new URL(getOperationsUrl(), request.url))
        }
        if (pathname.startsWith('/restaurantadmin')) {
          return NextResponse.redirect(new URL(getOperationsUrl(), request.url))
        }
        if (pathname === '/all-bills' || pathname.startsWith('/all-bills/')) {
          return NextResponse.redirect(new URL(getOperationsUrl(), request.url))
        }

        const permissions = (payload.permissions as string[] || []).map((p: string) => p.toLowerCase())

        // Map of protected paths to their required module permissions
        const pathPermissionMap: Record<string, string> = {
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
          '/bar-display': 'kitchen display',
          '/day-closing': 'day closing',
          '/operations/tables': 'table layout',
          '/operations/occupancy': 'live occupancy',
          '/table-reservations': 'table bookings',
          '/drivers': 'drivers',
          '/pos/gst-filing': 'gst filing',
          '/pos/gst-settings': 'gst filing',
        }

        const matchedPath = Object.keys(pathPermissionMap).find(
          p => strippedPathname === p || strippedPathname.startsWith(p + '/')
        )

        if (matchedPath) {
          const requiredPerm = pathPermissionMap[matchedPath]

          // Special bypass for POSSYSTEM role for standard POS modules
          const isStandardPosPath = ['/payments', '/invoices', '/billing', '/kots', '/inventory', '/products', '/categories', '/pos/gst-filing', '/pos/gst-settings'].some(
            p => strippedPathname.startsWith(p)
          )
          const shouldBypass = role === 'POSSYSTEM' && isStandardPosPath

          if (!permissions.includes(requiredPerm) && !shouldBypass) {
            if (pathname !== '/operations') {
              return NextResponse.redirect(new URL(getOperationsUrl(), request.url))
            }
          }
        }
      }
    }
  }

  // Hard route enforcement for Package Features
  // Applies to ALL non-SUPER_ADMIN roles (including RESTAURANTS_ADMIN and POSSYSTEM)
  if (payload && !isAdminRoute && isDashboardRoute) {
    const role = payload.role as string
    const packageFeatures = (payload.packageFeatures as string[] || [])

    if (role !== 'SUPER_ADMIN') {
      const pathToFeatureMap: Record<string, string> = {
        // POS
        '/billing':           'POS',
        '/bar-pos':           'POS',
        '/counter-payments':  'POS',
        '/all-bills':         'POS',
        '/products':          'POS',
        '/categories':        'POS',
        '/invoices':          'POS',
        '/payments':          'POS',
        '/orders':            'POS',
        '/kots':              'POS',
        '/kitchen-display':   'POS',
        '/bar-display':       'POS',
        '/day-closing':       'POS',
        // Inventory
        '/inventory':         'INVENTORY',
        // Accounting
        '/expenses':          'ACCOUNTING',
        '/accounts':          'ACCOUNTING',
        '/vouchers':          'ACCOUNTING',
        // Reports
        '/reports':           'REPORTS',
        // GST
        '/pos/gst-filing':    'GST',
        '/pos/gst-settings':  'GST',
        // Drivers
        '/drivers':           'DRIVERS',
        // Staff
        '/pos-staff':         'STAFF',
        // Tables
        '/operations/tables':  'TABLES',
        '/table-reservations': 'TABLES',
        // CRM & Memberships
        '/customers':          'CRM',
        '/memberships':        'CRM',
        // B2B
        '/b2b':                'B2B',
        // Hotel
        '/operations/occupancy': 'HMS',
      }

      const matchedPath = Object.keys(pathToFeatureMap).find(
        p => strippedPathname === p || strippedPathname.startsWith(p + '/')
      )
      if (matchedPath) {
        const requiredFeature = pathToFeatureMap[matchedPath]
        // Only block if the org has a package assigned (packageFeatures.length > 0)
        // If no package is assigned, let them through (grace mode)
        if (packageFeatures.length > 0 && !packageFeatures.includes(requiredFeature)) {
          // Special bypass for CRM module for standard POS roles to prevent stale JWT cookie issues
          const isCrmBypass = requiredFeature === 'CRM' && (role === 'RESTAURANTS_ADMIN' || role === 'POSSYSTEM')
          if (!isCrmBypass) {
            return NextResponse.redirect(new URL(getBrandedDashboardUrl(), request.url))
          }
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
