/**
 * tests/unit/gst.spec.ts
 * WP-0.0: Failing tests for GST engine bugs (TAX-01, HSN-01)
 * These tests FAIL before WP-0.4 fixes and PASS after.
 */
import { describe, it, expect } from 'vitest';
import { computeRoomGst, computeFoodGst } from '@/lib/hotel/gst-service';

describe('GST Engine', () => {
  /**
   * [TAX-01] Correct tax slab selection
   */
  describe('[TAX-01] Room GST slabs', () => {
    it('[TAX-01] ₹1,000/night (below ₹1,001) → 0% GST', () => {
      const result = computeRoomGst(1000, 1);
      expect(result.taxRate).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it('[TAX-01] ₹6,000/night (₹1,001–₹7,500) → 5% GST', () => {
      const result = computeRoomGst(6000, 1);
      expect(result.taxRate).toBe(5);
      expect(result.cgstRate).toBe(2.5);
      expect(result.sgstRate).toBe(2.5);
      expect(result.sacCode).toBe('996311');
      expect(result.totalTax).toBeCloseTo(300, 1);
      expect(result.totalAmountWithTax).toBeCloseTo(6300, 1);
    });

    it('[TAX-01] ₹7,500/night (at the threshold) → 5% GST', () => {
      const result = computeRoomGst(7500, 1);
      expect(result.taxRate).toBe(5);
    });

    it('[TAX-01] ₹7,501/night (above ₹7,500) → 18% GST', () => {
      const result = computeRoomGst(7501, 1);
      expect(result.taxRate).toBe(18);
      expect(result.cgstRate).toBe(9);
      expect(result.sgstRate).toBe(9);
    });

    it('[TAX-01] ₹8,000/night → 18% GST', () => {
      const result = computeRoomGst(8000, 1);
      expect(result.taxRate).toBe(18);
      expect(result.totalTax).toBeCloseTo(1440, 1);
      expect(result.totalAmountWithTax).toBeCloseTo(9440, 1);
    });

    it('[TAX-01] Complimentary stay → 0% GST regardless of tariff', () => {
      const result = computeRoomGst(10000, 1, true);
      expect(result.taxRate).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it('[TAX-01] Multi-night stay: 3 nights at ₹6,000 → 5% on total ₹18,000', () => {
      const result = computeRoomGst(6000, 3);
      expect(result.taxableAmount).toBe(18000);
      expect(result.totalTax).toBeCloseTo(900, 1);
    });
  });

  /**
   * [TAX-01] Discount must be applied BEFORE computing GST
   */
  describe('[TAX-01] Discount before tax', () => {
    it('[TAX-01] 10% discount on ₹6,000 → taxable = ₹5,400 → 5% GST on ₹5,400', () => {
      const originalAmount = 6000;
      const discountPct = 10;
      const discountedAmount = originalAmount * (1 - discountPct / 100); // 5400
      const result = computeRoomGst(discountedAmount, 1);
      // Taxable base should be the discounted amount, not original
      expect(result.taxableAmount).toBeCloseTo(5400, 0);
      expect(result.totalTax).toBeCloseTo(270, 1); // 5% of 5400
      // NOT 5% of 6000 (300) minus 10%
    });
  });

  /**
   * [HSN-01] SAC codes
   */
  describe('[HSN-01] SAC codes', () => {
    it('[HSN-01] Room charges use SAC 996311', () => {
      const result = computeRoomGst(5000, 1);
      expect(result.sacCode).toBe('996311');
    });

    it('[HSN-01] F&B charges use SAC 996331', () => {
      const result = computeFoodGst(500, false);
      expect(result.sacCode).toBe('996331');
    });

    it('[HSN-01] F&B at normal premises → 5%', () => {
      const result = computeFoodGst(1000, false);
      expect(result.taxRate).toBe(5);
    });

    it('[HSN-01] F&B at specified premises (any room > ₹7,500) → 18%', () => {
      const result = computeFoodGst(1000, true);
      expect(result.taxRate).toBe(18);
    });
  });

  /**
   * [TAX-01] CGST + SGST must equal total GST (balanced split)
   */
  describe('[TAX-01] CGST/SGST balance', () => {
    it('[TAX-01] CGST + SGST equals totalTax for 5% slab', () => {
      const result = computeRoomGst(6000, 1);
      expect(result.cgstAmount + result.sgstAmount).toBeCloseTo(result.totalTax, 2);
    });

    it('[TAX-01] CGST + SGST equals totalTax for 18% slab', () => {
      const result = computeRoomGst(8000, 1);
      expect(result.cgstAmount + result.sgstAmount).toBeCloseTo(result.totalTax, 2);
    });
  });

  /**
   * [TAX-01] Future requirement: IGST for inter-state billing
   * This documents the expected interface once WP-0.4 adds inter-state support.
   */
  describe('[TAX-01] GST engine returns fields needed by WP-0.4', () => {
    it('[TAX-01] computeRoomGst returns all required fields', () => {
      const result = computeRoomGst(6000, 1);
      expect(result).toMatchObject({
        tariffPerNight: expect.any(Number),
        taxRate: expect.any(Number),
        cgstRate: expect.any(Number),
        sgstRate: expect.any(Number),
        taxableAmount: expect.any(Number),
        cgstAmount: expect.any(Number),
        sgstAmount: expect.any(Number),
        totalTax: expect.any(Number),
        totalAmountWithTax: expect.any(Number),
        sacCode: expect.any(String),
      });
    });
  });
});
