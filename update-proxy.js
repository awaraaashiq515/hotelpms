const fs = require('fs');

let content = fs.readFileSync('src/proxy.ts', 'utf8');

const dashboardRootsArray = `[
    'dashboard', 'billing', 'bar-pos', 'counter-payments', 'invoices', 'payments',
    'inventory', 'kots', 'reports', 'settings', 'operations', 'drivers', 'pos-staff',
    'expenses', 'accounts', 'manage-properties', 'manage-users', 'manage-roles',
    'pos', 'vouchers', 'orders', 'all-bills', 'categories', 'products', 'day-closing',
    'table-reservations', 'memberships', 'customers', 'b2b', 'kitchen-display'
  ]`;

const newLogic = `
  const parts = pathname.split('/').filter(Boolean)
  const dashboardRoots = ${dashboardRootsArray}

  let strippedPathname = pathname
  let hasPropertyCode = false

  if (parts.length > 0 && !['admin', 'restaurantadmin', 'login', 'register', 'expired', 'payment-pending', 'api', '_next', 'images', 'downloads'].includes(parts[0])) {
    if (dashboardRoots.includes(parts[0])) {
      // Legacy access without propertyCode
      strippedPathname = pathname
    } else {
      hasPropertyCode = true
      strippedPathname = '/' + parts.slice(1).join('/')
    }
  }

  const isDashboardRoute = dashboardRoots.some(root => strippedPathname === \`/\${root}\` || strippedPathname.startsWith(\`/\${root}/\`))
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isExpiredPage = pathname === '/expired'
`;

// Replace the top part
content = content.replace(/const isDashboardRoute =[\s\S]*?const isExpiredPage = pathname === '\/expired'/g, newLogic);

// Replace /operations hardcodes with a function
const opsUrlHelper = `
  const getOperationsUrl = () => {
    return payload?.propertyCode ? \`/\${payload.propertyCode}/operations\` : '/operations'
  }
`;

content = content.replace(/\/\/ ── Helper: build the branded dashboard URL from the current session ──/, opsUrlHelper + '\n  // ── Helper: build the branded dashboard URL from the current session ──');

// Replace all NextResponse.redirect(new URL('/operations', request.url)) with getOperationsUrl()
content = content.replace(/NextResponse\.redirect\(new URL\('\/operations', request\.url\)\)/g, "NextResponse.redirect(new URL(getOperationsUrl(), request.url))");

// In the pathPermissionMap and pathToFeatureMap logic, replace pathname with strippedPathname
content = content.replace(/p => pathname === p \|\| pathname\.startsWith\(p \+ '\/'\)/g, "p => strippedPathname === p || strippedPathname.startsWith(p + '/')");
content = content.replace(/p => pathname\.startsWith\(p\)/g, "p => strippedPathname.startsWith(p)");

// Add the missing property code redirect
content = content.replace(/if \(payload\) {/, `if (payload) {
    if (isDashboardRoute && !hasPropertyCode && payload.propertyCode) {
      return NextResponse.redirect(new URL(\`/\${payload.propertyCode}\${pathname}\`, request.url))
    }
`);

fs.writeFileSync('src/proxy.ts', content);
console.log('Done');
