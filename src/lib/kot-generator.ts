import { prisma } from './prisma';

/**
 * Generates the next sequential KOT number (1, 2, 3...)
 * Returns format: "KOT-1", "KOT-2", "KOT-3", etc.
 * Starts from 1 and increments sequentially with each new KOT.
 */
export async function getNextKotNumber(propertyId?: string | null, client?: any): Promise<string> {
  const db = client || prisma;

  try {
    const kots = await db.kotTicket.findMany({
      where: propertyId ? { propertyId } : {},
      select: { kotNo: true },
    });

    let maxSeq = 0;
    for (const kot of kots) {
      if (!kot.kotNo) continue;
      // Match KOT-1, KOT-2, KOT-DEL-1, KOT-QR-1, etc.
      const match = kot.kotNo.match(/KOT-(?:[A-Z]+-)?(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        // Exclude huge timestamp numbers (e.g. > 100000) so sequence cleanly tracks real order numbers
        if (!isNaN(num) && num < 100000 && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    let nextNum = maxSeq + 1;
    let candidate = `KOT-${nextNum}`;

    // Guarantee uniqueness in KotTicket table (handles any potential DB constraint)
    while (await db.kotTicket.findUnique({ where: { kotNo: candidate } })) {
      nextNum++;
      candidate = `KOT-${nextNum}`;
    }

    return candidate;
  } catch (err) {
    console.error('[getNextKotNumber] Error computing next KOT number:', err);
    // Fallback to timestamp only if DB query completely fails
    return `KOT-${Date.now().toString().slice(-4)}`;
  }
}
