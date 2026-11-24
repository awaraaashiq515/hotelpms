/**
 * src/lib/money.ts
 * Core money math utility (Rule #1: Money = integer paise).
 * Avoids IEEE-754 floating point imprecision in calculations.
 */

/**
 * Converts a rupee float (or number) into integer paise.
 * Uses Math.round to safely convert representation errors like 0.29 -> 28.999999999999996.
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise into formatted Indian Rupee string (₹X,XX,XXX.XX).
 */
export function toRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Adds two paise integers.
 */
export function addPaise(a: number, b: number): number {
  return Math.round(a) + Math.round(b);
}

/**
 * Subtracts b from a in paise.
 */
export function subPaise(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

/**
 * Multiplies paise by a quantity or factor and rounds half up.
 */
export function mulPaise(paise: number, factor: number): number {
  return roundHalfUp(paise * factor);
}

/**
 * Standard round half-up for currency math.
 */
export function roundHalfUp(n: number): number {
  return Math.round(n);
}
