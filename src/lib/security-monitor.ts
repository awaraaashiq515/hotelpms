// Security Threat Detection Engine — GuestFlow PMS
// Detects: brute force, SQL injection, XSS, path scanning, suspicious bots

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export type ThreatType =
  | 'BRUTE_FORCE'
  | 'SQL_INJECTION'
  | 'XSS'
  | 'PATH_SCAN'
  | 'RATE_LIMIT'
  | 'SUSPICIOUS_IP'
  | 'AUTH_FAIL'
  | 'DATA_BREACH_ATTEMPT'
  | 'BOT_DETECTED'
  | 'PAYLOAD_ATTACK';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ThreatResult {
  detected: boolean;
  type?: ThreatType;
  severity?: Severity;
  message?: string;
}

// ─── SQL Injection Patterns ──────────────────────────────────────────────────
const SQL_PATTERNS = [
  /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
  /(UNION\s+SELECT|UNION\s+ALL\s+SELECT)/i,
  /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
  /(--\s*$|\/\*[\s\S]*?\*\/)/,
  /(\bEXEC\b|\bEXECUTE\b|\bxp_|\bsp_)/i,
  /(['";](\s*)(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE))/i,
];

// ─── XSS Patterns ───────────────────────────────────────────────────────────
const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']?[^"']*["']?/i,
  /<iframe[\s\S]*?>/i,
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
  /<img[^>]+src\s*=\s*["']javascript:/i,
];

// ─── Suspicious Paths (hacker scans) ────────────────────────────────────────
const SUSPICIOUS_PATHS = [
  '/wp-admin', '/wp-login.php', '/phpmyadmin', '/.env',
  '/admin/config', '/shell', '/cmd', '/eval',
  '/etc/passwd', '/.git', '/config.php', '/phpinfo',
  '/../', '/boot.ini', '/proc/self', '/admin.php',
  '/setup.php', '/install.php', '/backup.zip',
];

// ─── Suspicious User Agents (scanners/bots) ─────────────────────────────────
const SUSPICIOUS_AGENTS = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
  'acunetix', 'dirbuster', 'hydra', 'medusa',
  'burpsuite', 'havij', 'nessus', 'openvas',
];

// ─── In-memory brute force tracker ──────────────────────────────────────────
const authFailMap = new Map<string, { count: number; firstAt: number }>();

// ─── Main Analyzer ───────────────────────────────────────────────────────────

export function analyzeRequest(
  path: string,
  method: string,
  ip: string,
  userAgent: string,
  body?: string,
  query?: string,
): ThreatResult {
  const combined = `${body || ''} ${query || ''}`.toLowerCase();
  const uaLower = userAgent.toLowerCase();
  const pathLower = path.toLowerCase();

  // 1. Suspicious path scan
  for (const suspicious of SUSPICIOUS_PATHS) {
    if (pathLower.includes(suspicious)) {
      return {
        detected: true,
        type: 'PATH_SCAN',
        severity: 'high',
        message: `Suspicious path accessed: ${path} from IP ${ip}`,
      };
    }
  }

  // 2. Bot/Scanner detection
  for (const bot of SUSPICIOUS_AGENTS) {
    if (uaLower.includes(bot)) {
      return {
        detected: true,
        type: 'BOT_DETECTED',
        severity: 'critical',
        message: `Known attack tool detected: "${bot}" from IP ${ip}`,
      };
    }
  }

  // 3. SQL Injection in payload
  if (combined) {
    for (const pattern of SQL_PATTERNS) {
      if (pattern.test(combined)) {
        return {
          detected: true,
          type: 'SQL_INJECTION',
          severity: 'critical',
          message: `SQL injection attempt on ${method} ${path} from IP ${ip}`,
        };
      }
    }

    // 4. XSS in payload
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(combined)) {
        return {
          detected: true,
          type: 'XSS',
          severity: 'high',
          message: `XSS attempt on ${method} ${path} from IP ${ip}`,
        };
      }
    }
  }

  return { detected: false };
}

// ─── Auth Fail Tracker (Brute Force) ────────────────────────────────────────

export function trackAuthFail(ip: string): ThreatResult {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 min window
  const threshold = 5; // 5 fails → alert

  const existing = authFailMap.get(ip);

  if (!existing || now - existing.firstAt > windowMs) {
    authFailMap.set(ip, { count: 1, firstAt: now });
    return { detected: false };
  }

  existing.count += 1;

  if (existing.count >= threshold) {
    authFailMap.delete(ip); // reset
    return {
      detected: true,
      type: 'BRUTE_FORCE',
      severity: 'critical',
      message: `Brute force detected: ${existing.count} failed login attempts from IP ${ip} in 10 minutes`,
    };
  }

  if (existing.count >= 3) {
    return {
      detected: true,
      type: 'AUTH_FAIL',
      severity: 'medium',
      message: `Multiple auth failures (${existing.count}) from IP ${ip}`,
    };
  }

  return { detected: false };
}

// ─── Save Alert to DB ────────────────────────────────────────────────────────

export async function saveSecurityAlert(opts: {
  type: ThreatType;
  severity: Severity;
  message: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  payload?: string;
  userId?: string;
  propertyId?: string;
}): Promise<void> {
  try {
    await (prisma as any).securityAlert.create({ data: opts });
  } catch (err) {
    // Don't crash the app if DB is unavailable
    console.error('[SecurityAlert] Failed to save:', err);
  }
}

// ─── Extract IP from request ─────────────────────────────────────────────────

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

// ─── Full request scanner (call this in middleware or API routes) ─────────────

export async function scanRequest(
  req: NextRequest,
  bodyText?: string,
): Promise<ThreatResult> {
  const ip = getClientIP(req);
  const ua = req.headers.get('user-agent') || '';
  const path = req.nextUrl.pathname;
  const method = req.method;
  const query = req.nextUrl.search;

  const result = analyzeRequest(path, method, ip, ua, bodyText, query);

  if (result.detected && result.type && result.severity) {
    await saveSecurityAlert({
      type: result.type,
      severity: result.severity,
      message: result.message || 'Threat detected',
      ip,
      userAgent: ua,
      path,
      method,
      payload: bodyText?.slice(0, 500), // limit stored payload size
    });
  }

  return result;
}

