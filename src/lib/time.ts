/**
 * src/lib/time.ts
 * WP-0.1 — Single source of truth for all date/time operations.
 *
 * Rules:
 *   - Store UTC in DB (Prisma/SQLite always stores UTC).
 *   - Display in the property timezone (default Asia/Kolkata).
 *   - Business date = calendar date in the property timezone.
 *   - Never use new Date().toLocaleDateString() elsewhere.
 *
 * Tests: TZ-01, DASH-01, BKG-01, DISP-02, RPT-01
 */

export const DEFAULT_TZ = 'Asia/Kolkata';
export const HOTEL_TIMEZONE = DEFAULT_TZ;

/**
 * Returns today's business date as a YYYY-MM-DD string in the given timezone.
 * This is the canonical replacement for `new Date().toISOString().split('T')[0]`.
 *
 * @param tz     IANA timezone string (defaults to Asia/Kolkata)
 * @param base   Base Date to compute from (defaults to now). Useful for testing.
 * @returns      "YYYY-MM-DD" in the given timezone.
 *
 * @example
 *   // At 00:30 IST (19:00 UTC previous day) this returns the IST date, not the UTC date.
 *   businessDate('Asia/Kolkata', new Date('2026-11-21T19:00:00.000Z')) // => '2026-11-22'
 */
export function businessDate(tz: string = DEFAULT_TZ, base: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(base); // en-CA produces YYYY-MM-DD natively
}

/**
 * Returns the current moment as a Date whose wall-clock time matches the given timezone.
 * The returned Date is still a UTC Date object — use it for storage.
 * For display, pair with fmt().
 *
 * @param tz  IANA timezone string (defaults to Asia/Kolkata)
 */
export function nowInTz(tz: string = DEFAULT_TZ): Date {
  // Returns the actual current instant — the timezone only affects display.
  // This function exists so callers can be found and audited.
  void tz; // timezone is used at display layer, not at creation layer
  return new Date();
}

/**
 * Formats a Date in the given timezone according to a pattern string.
 * Pattern tokens (a subset of date-fns / dayjs):
 *   YYYY  full year      MM    zero-padded month    DD    zero-padded day
 *   HH    24h hour       mm    minute               ss    second
 *   hh    12h hour       A     AM/PM
 *
 * @param date     The UTC Date to format
 * @param tz       IANA timezone string
 * @param pattern  Format pattern
 *
 * @example
 *   fmt(new Date('2026-11-21T18:30:00.000Z'), 'Asia/Kolkata', 'HH:mm') // => '00:00'
 */
export function fmt(date: Date, tz: string, pattern: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  let hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  // Intl with hour12:false may return '24' at midnight — normalize to '00'
  if (hour === '24') hour = '00';

  const hour12 = String(parseInt(hour, 10) % 12 || 12).padStart(2, '0');
  const ampm = parseInt(hour, 10) < 12 ? 'AM' : 'PM';

  return pattern
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('hh', hour12)
    .replace('mm', minute)
    .replace('ss', second)
    .replace('A', ampm);
}

/**
 * Returns the UTC Date representing the start of the business day
 * (00:00:00.000 in the given timezone).
 *
 * @param tz    IANA timezone string (defaults to Asia/Kolkata)
 * @param base  Base Date (defaults to now)
 */
export function startOfBusinessDay(tz: string = DEFAULT_TZ, base: Date = new Date()): Date {
  const dateStr = businessDate(tz, base); // YYYY-MM-DD in tz
  // Parse as midnight in the given timezone
  return zonedMidnight(dateStr, tz);
}

/**
 * Returns the UTC Date representing the end of the business day
 * (23:59:59.999 in the given timezone).
 */
export function endOfBusinessDay(tz: string = DEFAULT_TZ, base: Date = new Date()): Date {
  const start = startOfBusinessDay(tz, base);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Parses a "YYYY-MM-DD" string as midnight in the given timezone and returns
 * the equivalent UTC Date. Use this whenever you receive a date-only string
 * from the client and need to query the DB.
 *
 * @param dateStr  "YYYY-MM-DD"
 * @param tz       IANA timezone string (defaults to Asia/Kolkata)
 */
export function parseBusinessDate(dateStr: string, tz: string = DEFAULT_TZ): Date {
  return zonedMidnight(dateStr, tz);
}

/**
 * Returns the financial year string for a given date in IST.
 * Indian FY runs April 1 → March 31.
 *
 * @param date  Date to evaluate (defaults to now in IST)
 * @returns     e.g. "2026-27"
 */
export function financialYear(date: Date = new Date()): string {
  const dateStr = businessDate(DEFAULT_TZ, date); // YYYY-MM-DD in IST
  const [yearStr, monthStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-based

  if (month >= 4) {
    // April–December: FY is year → year+1
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    // January–March: FY is year-1 → year
    return `${year - 1}-${String(year).slice(2)}`;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Returns the UTC Date for midnight (00:00:00.000) of `dateStr` in `tz`.
 * Uses the trick of formatting a known UTC offset.
 */
function zonedMidnight(dateStr: string, tz: string): Date {
  // We abuse Date constructor by creating an ISO string with the timezone offset
  // that corresponds to midnight in `tz` on `dateStr`.
  // Strategy: use Intl to find what UTC time equals midnight in tz on that date.

  // Parse the date components
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  // Create a Date at noon UTC on that day — far from DST boundaries
  const noonUtc = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));

  // Find what that UTC time looks like in the target timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(noonUtc);

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
  const tzHour = get('hour');   // what hour it is in tz at noonUtc
  const tzMinute = get('minute');

  // The offset of tz from UTC at this date (in ms)
  // noonUtc UTC = tzHour:tzMinute in tz → offset = tzHour:tzMinute - 12:00
  const offsetMs = (tzHour * 60 + tzMinute - 12 * 60) * 60 * 1000;

  // Midnight in tz = UTC midnight − offset
  const utcMidnight = Date.UTC(year, month, day, 0, 0, 0, 0) - offsetMs;
  return new Date(utcMidnight);
}
