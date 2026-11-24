/**
 * GST Engine for Hotel Accommodation & F&B Services
 * Compliant with GST Notification effective 22 Sept 2025:
 * - Room Tariff ₹1,001 - ₹7,500 / night: 5% GST (CGST 2.5% + SGST 2.5%) without ITC
 * - Room Tariff above ₹7,500 / night: 18% GST (CGST 9% + SGST 9%)
 * - Room Tariff below ₹1,001 / night: 0% GST (Exempt)
 * - Complimentary / Waived stays: 0% GST (Excluded from revenue)
 * - Restaurant / F&B Services: SAC 996331
 *   - 18% if hotel is 'Specified Premises' (has any room tariff > ₹7,500)
 *   - 5% otherwise
 */

export interface RoomTaxComputation {
  tariffPerNight: number;
  taxRate: number; // e.g. 5 or 18
  cgstRate: number; // e.g. 2.5 or 9
  sgstRate: number; // e.g. 2.5 or 9
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalTax: number;
  totalAmountWithTax: number;
  sacCode: string;
}

export function computeRoomGst(
  tariffPerNight: number,
  nights: number = 1,
  isComplimentary: boolean = false
): RoomTaxComputation {
  if (isComplimentary || tariffPerNight <= 0) {
    return {
      tariffPerNight: 0,
      taxRate: 0,
      cgstRate: 0,
      sgstRate: 0,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      totalTax: 0,
      totalAmountWithTax: 0,
      sacCode: '996311',
    };
  }

  const baseTaxable = tariffPerNight * nights;
  let taxRate = 0;

  if (tariffPerNight < 1001) {
    taxRate = 0;
  } else if (tariffPerNight <= 7500) {
    taxRate = 5; // 5% slab
  } else {
    taxRate = 18; // 18% slab for luxury > 7,500
  }

  const halfRate = taxRate / 2;
  const totalTax = Math.round(((baseTaxable * taxRate) / 100) * 100) / 100;
  const cgstAmount = Math.round(((baseTaxable * halfRate) / 100) * 100) / 100;
  const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

  return {
    tariffPerNight,
    taxRate,
    cgstRate: halfRate,
    sgstRate: halfRate,
    taxableAmount: baseTaxable,
    cgstAmount,
    sgstAmount,
    totalTax,
    totalAmountWithTax: baseTaxable + totalTax,
    sacCode: '996311',
  };
}

export function computeFoodGst(
  amount: number,
  isSpecifiedPremises: boolean = false
) {
  if (amount <= 0) {
    return {
      taxRate: 0,
      cgstRate: 0,
      sgstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      totalTax: 0,
      taxableAmount: 0,
      sacCode: '996331',
    };
  }

  // 18% for specified premises (hotels with room tariff > 7,500), else 5%
  const taxRate = isSpecifiedPremises ? 18 : 5;
  const halfRate = taxRate / 2;
  const totalTax = Math.round(((amount * taxRate) / 100) * 100) / 100;
  const cgstAmount = Math.round(((amount * halfRate) / 100) * 100) / 100;
  const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

  return {
    taxRate,
    cgstRate: halfRate,
    sgstRate: halfRate,
    cgstAmount,
    sgstAmount,
    totalTax,
    taxableAmount: amount,
    sacCode: '996331',
  };
}

import { financialYear } from '@/lib/time';

/**
 * Returns current Indian Financial Year string (e.g. "2026-27").
 */
export function getCurrentFinancialYear(date: Date = new Date()): string {
  return financialYear(date);
}
