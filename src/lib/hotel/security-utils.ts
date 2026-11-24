/**
 * Security and privacy utilities for KYC and guest records.
 */

/**
 * Masks 12-digit Aadhaar number as XXXX-XXXX-1234 or general ID to hide sensitive details.
 */
export function maskAadhaar(idNumber?: string | null): string {
  if (!idNumber) return '';
  const str = String(idNumber).trim();
  const clean = str.replace(/[\s-]/g, '');

  if (/^\d{12}$/.test(clean)) {
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
  if (clean.length >= 8) {
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
  if (clean.length > 4) {
    return `••••-••••-${clean.slice(-4)}`;
  }
  return str;
}

/**
 * Never exposes owner/VIP PINs in plain text to reception or general UI.
 */
export function maskPin(pin?: string | null): string {
  if (!pin) return '';
  return '••••';
}
