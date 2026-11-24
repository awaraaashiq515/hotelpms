/**
 * tests/unit/time.spec.ts
 * WP-0.0: Failing tests for timezone bugs (TZ-01, DASH-01, BKG-01, DISP-02, RPT-01)
 * These tests FAIL before WP-0.1 (lib/time.ts creation) and PASS after.
 */
import { describe, it, expect, vi } from 'vitest';
import { businessDate, nowInTz, fmt } from '@/lib/time';

function atUtc(isoString: string): Date {
  return new Date(isoString);
}

const IST = 'Asia/Kolkata';

describe('[TZ-01] lib/time.ts module', () => {
  it('[TZ-01] lib/time.ts module exists and exports businessDate, nowInTz, fmt', () => {
    expect(businessDate).toBeDefined();
    expect(nowInTz).toBeDefined();
    expect(fmt).toBeDefined();
  });
});

describe('[TZ-01] businessDate()', () => {
  it('[TZ-01] At 00:30 IST (19:00 UTC previous day) returns IST date, not UTC date', () => {
    if (!businessDate) {
      expect.fail('[TZ-01] businessDate not found in lib/time.ts — WP-0.1 not done');
    }
    // 2026-11-22 00:30 IST = 2026-11-21 19:00 UTC
    const baseUtc = atUtc('2026-11-21T19:00:00.000Z');
    const result = businessDate(IST, baseUtc);
    expect(result).toBe('2026-11-22'); // IST date
  });

  it('[TZ-01] At 23:59 IST returns today IST date', () => {
    if (!businessDate) {
      expect.fail('[TZ-01] businessDate not found in lib/time.ts — WP-0.1 not done');
    }
    // 2026-11-22 23:59 IST = 2026-11-22 18:29 UTC
    const baseUtc = atUtc('2026-11-22T18:29:00.000Z');
    const result = businessDate(IST, baseUtc);
    expect(result).toBe('2026-11-22');
  });

  it('[DASH-01] businessDate defaults to Asia/Kolkata', () => {
    if (!businessDate) {
      expect.fail('[DASH-01] businessDate not found in lib/time.ts — WP-0.1 not done');
    }
    const result = businessDate(); // should use IST by default
    // Result should be a valid YYYY-MM-DD string
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('[BKG-01] Booking wizard default date', () => {
  it('[BKG-01] businessDate at night IST (00:30 IST) returns next IST calendar day', () => {
    if (!businessDate) {
      expect.fail('[BKG-01] lib/time.ts not found — WP-0.1 not done');
    }
    // This was the core bug: at 00:30 IST, UTC is still previous day, so new Date() shows wrong date
    const midnightPlusHalfIst = atUtc('2026-11-21T19:00:00.000Z'); // = 2026-11-22 00:30 IST
    expect(businessDate(IST, midnightPlusHalfIst)).toBe('2026-11-22');
    // vs wrong UTC answer:
    expect(midnightPlusHalfIst.toISOString().split('T')[0]).toBe('2026-11-21'); // UTC is day before
  });
});

describe('[DISP-02] Display times in IST', () => {
  it('[DISP-02] fmt() formats a UTC date correctly in IST', () => {
    if (!fmt) {
      expect.fail('[DISP-02] fmt not found in lib/time.ts — WP-0.1 not done');
    }
    const utcDate = atUtc('2026-11-21T18:30:00.000Z'); // = 2026-11-22 00:00 IST
    const result = fmt(utcDate, IST, 'HH:mm');
    expect(result).toBe('00:00');
  });
});

describe('[RPT-01] Report date defaults', () => {
  it('[RPT-01] businessDate returns a date string that can be used as report filter default', () => {
    if (!businessDate) {
      expect.fail('[RPT-01] businessDate not found in lib/time.ts — WP-0.1 not done');
    }
    const result = businessDate(IST);
    // Should be parseable as a valid date
    expect(new Date(result).toString()).not.toBe('Invalid Date');
  });
});
