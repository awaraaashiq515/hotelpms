/**
 * tests/unit/money.spec.ts
 * WP-0.0: Tests for money handling correctness
 * Validates that paise-based arithmetic avoids float errors (Rule #1)
 */
import { describe, it, expect } from 'vitest';
import { toPaise, toRupees, addPaise, roundHalfUp } from '@/lib/money';

describe('[FOL-02] Money arithmetic without float errors', () => {
  it('Classic float bug: 0.1 + 0.2 ≠ 0.3 in floating point', () => {
    // This demonstrates why floats are dangerous for money
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(0.1 + 0.2).toBeCloseTo(0.3, 10);
  });

  it('Paise arithmetic is exact: 10 paise + 20 paise = 30 paise', () => {
    if (!addPaise) {
      expect.fail('lib/money.ts not found — WP-0.1 not done');
    }
    expect(addPaise(10, 20)).toBe(30);
  });

  it('[FOL-02] toPaise converts rupees to paise without floating point error', () => {
    if (!toPaise) {
      expect.fail('lib/money.ts not found — WP-0.1 not done');
    }
    expect(toPaise(100)).toBe(10000);
    expect(toPaise(0.01)).toBe(1);
    expect(toPaise(7500)).toBe(750000);
    // No floating point artifacts
    expect(toPaise(0.1) + toPaise(0.2)).toBe(toPaise(0.3));
  });

  it('[FOL-02] toRupees formats paise as Indian currency string', () => {
    if (!toRupees) {
      expect.fail('lib/money.ts not found — WP-0.1 not done');
    }
    expect(toRupees(100000)).toBe('₹1,000.00');
    expect(toRupees(600000)).toBe('₹6,000.00');
    expect(toRupees(0)).toBe('₹0.00');
  });

  it('[FOL-02] GST computed on paise base matches manual calculation', () => {
    // ₹6,000 at 5% = ₹300 GST
    const taxablePaise = 600000; // ₹6,000
    const gstPct = 5;
    const gstPaise = Math.round(taxablePaise * gstPct / 100);
    expect(gstPaise).toBe(30000); // ₹300 exactly
  });
});
