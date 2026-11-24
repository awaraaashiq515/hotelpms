/**
 * src/lib/validators/indian.ts
 * Validation routines for Indian business logic & KYC compliance.
 */

// Verhoeff algorithm tables for Aadhaar checksum verification
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Validates 10-digit Indian Mobile number.
 * Must start with 6, 7, 8, or 9 and be exactly 10 digits without prefix.
 */
export function validateIndianMobile(mobile: string): boolean {
  if (typeof mobile !== 'string') return false;
  return /^[6-9]\d{9}$/.test(mobile);
}

/**
 * Validates 12-digit Indian Aadhaar number with Verhoeff check.
 */
export function validateAadhaar(aadhaar: string): boolean {
  if (typeof aadhaar !== 'string') return false;
  if (!/^\d{12}$/.test(aadhaar)) return false;
  if (/^(\d)\1{11}$/.test(aadhaar)) return false; // reject all same digits like 111111111111

  // Verhoeff checksum
  let c = 0;
  const invertedArray = aadhaar.split('').map(Number).reverse();
  for (let i = 0; i < invertedArray.length; i++) {
    c = d[c][p[i % 8][invertedArray[i]]];
  }
  return c === 0;
}

/**
 * Validates Indian Permanent Account Number (PAN).
 * Format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F).
 */
export function validatePan(pan: string): boolean {
  if (typeof pan !== 'string') return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

/**
 * Validates Indian Goods and Services Tax Identification Number (GSTIN).
 * Format: 2 digit state code + 10 char PAN + 1 entity code + 'Z' + 1 checksum digit/char
 * e.g. 02ABCDE1234F1Z5
 */
export function validateGstin(gstin: string): boolean {
  if (typeof gstin !== 'string') return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase());
}

/**
 * Validates discount percentage (must be between 0 and 100 inclusive).
 */
export function validateDiscount(pct: number): boolean {
  if (typeof pct !== 'number' || isNaN(pct)) return false;
  return pct >= 0 && pct <= 100;
}

/**
 * Validates strictly positive number (> 0).
 */
export function validatePositiveAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) return false;
  return amount > 0;
}
