import { NextRequest, NextResponse } from 'next/server';

// ─── Patterns (edge-compatible, no Prisma) ───────────────────────────────────

const SQL_PATTERNS = [
  /(\bUNION\s+SELECT|\bUNION\s+ALL\s+SELECT)/i,
  /(--\s*$|\/\*[\s\S]*?\*\/)/,
  /(\bEXEC\b|\bEXECUTE\b|\bxp_|\bsp_)/i,
  /(['";](\s*)(DROP|DELETE|TRUNCATE))/i,
];

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /eval\s*\(/i,
];

const SUSPICIOUS_PATHS = [
  '/wp-admin', '/wp-login', '/phpmyadmin', '/.env',
  '/shell', '/cmd', '/eval', '/etc/passwd', '/.git',
  '/config.php', '/phpinfo', '/backup.zip', '/install.php',
];

const SUSPICIOUS_AGENTS = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'acunetix',
  'dirbuster', 'hydra', 'burpsuite', 'havij', 'nessus',
];

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  const ip = getClientIP(request);
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const query = request.nextUrl.search;

  // Skip static files and internals
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.endsWith('.ico') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.css') ||
    path === '/api/admin/security-log' // avoid loop
  ) {
    return NextResponse.next();
  }

  let threatType: string | null = null;
  let severity: string = 'medium';
  let message: string = '';

  // 1. Known attack tools
  for (const bot of SUSPICIOUS_AGENTS) {
    if (ua.includes(bot)) {
      threatType = 'BOT_DETECTED';
      severity = 'critical';
      message = `Known attack tool "${bot}" detected from IP ${ip}`;
      break;
    }
  }

  // 2. Suspicious path scan
  if (!threatType) {
    for (const suspicious of SUSPICIOUS_PATHS) {
      if (path.toLowerCase().includes(suspicious)) {
        threatType = 'PATH_SCAN';
        severity = 'high';
        message = `Suspicious path scan: ${path} from IP ${ip}`;
        break;
      }
    }
  }

  // 3. SQL in query string
  if (!threatType && query) {
    for (const pattern of SQL_PATTERNS) {
      if (pattern.test(query)) {
        threatType = 'SQL_INJECTION';
        severity = 'critical';
        message = `SQL injection in query string on ${method} ${path} from IP ${ip}`;
        break;
      }
    }
  }

  // 4. XSS in query string
  if (!threatType && query) {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(query)) {
        threatType = 'XSS';
        severity = 'high';
        message = `XSS attempt in query on ${method} ${path} from IP ${ip}`;
        break;
      }
    }
  }

  // If threat detected → log it and optionally block
  if (threatType) {
    const baseUrl = request.nextUrl.origin;
    // Fire-and-forget log (don't await)
    fetch(`${baseUrl}/api/admin/security-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: threatType,
        severity,
        message,
        ip,
        userAgent: request.headers.get('user-agent'),
        path,
        method,
        payload: query?.slice(0, 300),
      }),
    }).catch(() => {});

    // Block critical threats immediately
    if (severity === 'critical' && ['SQL_INJECTION', 'BOT_DETECTED'].includes(threatType)) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Request blocked' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
