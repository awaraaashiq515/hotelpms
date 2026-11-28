export interface ParsedEmailDetails {
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  amount: number | null;
  grossAmount: number | null;
  netPayout: number | null;
  roomCharges: number | null;
  taxAmount: number | null;
  commissionAmount: number | null;
  paymentMode: string | null;
  source: string;
  roomCategory: string | null;
  roomsCount: number;
  adults: number;
  children: number;
  mealPlan: 'RO' | 'CP' | 'MAP' | 'AP';
  specialRequests: string | null;
  isPrepaid: boolean;
}

export function detectOtaSource(subject: string, text: string): string {
  const content = `${subject} ${text}`.toLowerCase();
  if (content.includes('agoda')) return 'Agoda';
  if (content.includes('booking.com')) return 'Booking.com';
  if (content.includes('airbnb')) return 'Airbnb';
  if (content.includes('makemytrip') || content.includes('mmt')) return 'MakeMyTrip';
  if (content.includes('goibibo')) return 'Goibibo';
  if (content.includes('expedia')) return 'Expedia';
  if (content.includes('yatra')) return 'Yatra';
  if (content.includes('easemytrip')) return 'EaseMyTrip';
  if (content.includes('cleartrip')) return 'Cleartrip';
  if (content.includes('trivago')) return 'Trivago';
  return 'Direct';
}

function parseFlexibleDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*/i, '')
    // Handle apostrophe short year like "28 May '26" -> "28 May 2026"
    .replace(/'(\d{2})\b/g, '20$1')
    // Strip trailing time like "12:00 PM" or "(2 Nights)"
    .replace(/\(\d+\s*Nights?\)/gi, '')
    .replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const d = new Date(cleaned);
  if (!isNaN(d.getTime()) && d.getFullYear() >= 2020 && d.getFullYear() <= 2035) {
    return d;
  }
  const d2 = new Date(raw.trim());
  if (!isNaN(d2.getTime()) && d2.getFullYear() >= 2020 && d2.getFullYear() <= 2035) {
    return d2;
  }
  return null;
}

function toTitleCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function deriveNameFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = email.split('@')[0];
  const cleaned = local.replace(/\d+$/, '').replace(/[._-]/g, ' ').trim();
  const parts = cleaned.split(' ').filter((p) => p.length > 1);
  if (parts.length >= 2) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  }
  if (parts.length === 1 && parts[0].length > 2) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }
  return null;
}

export function parseEmailBookingDetails(
  subject: string,
  rawText: string,
  fallbackName?: string | null,
  fallbackEmail?: string | null,
  fallbackPhone?: string | null
): ParsedEmailDetails {
  const source = detectOtaSource(subject, rawText);
  const text = (rawText || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ');

  // 1. Guest Name
  let guestName: string | null =
    fallbackName && fallbackName !== 'Unknown Guest' && fallbackName.trim().length > 0
      ? fallbackName.trim()
      : null;

  if (!guestName) {
    // Goibibo Hotelier Voucher: "PRIMARY GUEST DETAILS PRASHANT SHINDE"
    const primaryDetailsMatch = text.match(
      /PRIMARY\s+GUEST\s+DETAILS\s+([A-Za-z ]{3,45}?)(?=\s+(?:BOOKING|CHECK-IN|CHECKIN|gotribe|PHONE|EMAIL)|$)/i
    );
    if (primaryDetailsMatch?.[1]) {
      guestName = toTitleCase(primaryDetailsMatch[1]);
    }
  }

  if (!guestName) {
    const primaryNameMatch = text.match(
      /(?:Primary\s+guest|Customer|Booked\s+By|Guest\s+Name|Guest)\s*[:*]\s*([A-Za-z ]+?)(?:\s+(?:Guest\s+Email|Email|Phone|Mobile|Contact|Hotel|Check[-_]in|Arrival|Stay|Nights|Room|Rate)|$)/i
    );
    if (primaryNameMatch?.[1]) {
      const candidate = primaryNameMatch[1].trim();
      if (
        !candidate.toLowerCase().includes('details') &&
        !candidate.toLowerCase().includes('email') &&
        candidate.length > 2
      ) {
        guestName = toTitleCase(candidate);
      }
    }
  }

  if (!guestName || guestName.toLowerCase().includes('details')) {
    const firstNameMatch = text.match(
      /(?:Customer\s+First\s+Name|First\s+Name)\s*[:*]*\s*([A-Za-z ]+?)(?=\s+(?:Customer\s+Last\s+Name|Last\s+Name|Check[-_]in|$))/i
    );
    const lastNameMatch = text.match(
      /(?:Customer\s+Last\s+Name|Last\s+Name)\s*[:*]*\s*([A-Za-z ]+?)(?=\s+(?:Check[-_]in|Other\s+Guests|Room|$))/i
    );
    if (firstNameMatch?.[1]) {
      guestName = firstNameMatch[1].trim();
      if (lastNameMatch?.[1]) guestName += ' ' + lastNameMatch[1].trim();
      guestName = toTitleCase(guestName);
    }
  }

  if (!guestName || guestName === 'Unknown Guest' || guestName.toLowerCase().includes('details')) {
    const subjectMatch = subject.match(/(?:[-|–—]\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (subjectMatch?.[1]) {
      const candidate = subjectMatch[1].trim();
      if (
        !candidate.includes('Hotel') &&
        !candidate.includes('Mandi') &&
        !candidate.includes('Test') &&
        !candidate.includes('Room')
      ) {
        guestName = candidate;
      }
    }
  }

  if (!guestName || guestName.toLowerCase().includes('details')) {
    const dearMatch = text.match(/Dear\s+([A-Za-z ]{3,40})/i);
    if (dearMatch?.[1] && !dearMatch[1].toLowerCase().includes('hotel')) {
      guestName = dearMatch[1].trim();
    }
  }

  // 2. Email
  let guestEmail: string | null = fallbackEmail || null;
  if (!guestEmail) {
    const emailMatch = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
    if (emailMatch) {
      const filtered = emailMatch.filter(
        (e) =>
          !e.includes('agoda') &&
          !e.includes('booking.com') &&
          !e.includes('noreply') &&
          !e.includes('vedika') &&
          !e.includes('indeed') &&
          !e.includes('hostinger') &&
          !e.includes('makemytrip') &&
          !e.includes('goibibo') &&
          !e.includes('cleartrip') &&
          !e.includes('yatra') &&
          !e.includes('easemytrip') &&
          !e.includes('expedia')
      );
      if (filtered.length > 0) guestEmail = filtered[0];
    }
  }

  if (!guestName || guestName === 'Unknown Guest') {
    guestName = deriveNameFromEmail(guestEmail) || 'Unknown Guest';
  }

  // 3. Phone
  let guestPhone: string | null = fallbackPhone || null;
  if (!guestPhone) {
    const phoneMatch = text.match(
      /(?:guest\s+phone|phone|mobile|contact|tel)\s*[:*]+\s*([+]?[\d\s\-()]{8,20})/i
    );
    if (phoneMatch?.[1]) {
      const cleaned = phoneMatch[1].replace(/[\s\-()]/g, '').trim();
      if (cleaned.length >= 8) guestPhone = cleaned;
    }
  }

  // 4. Check-In & Check-Out
  let checkIn: Date | null = null;
  let checkOut: Date | null = null;

  // Format A: "Stay: Wednesday, 20 January 2027 to Friday, 22 January 2027 (2 nights)"
  const stayMatch = text.match(
    /Stay\s*[:*]+\s*([A-Za-z0-9 ,\-/]+?)\s+to\s+([A-Za-z0-9 ,\-/]+?)(?:\s*\(|\s+Room|\s+Hotel|$)/i
  );
  if (stayMatch?.[1] && stayMatch?.[2]) {
    checkIn = parseFlexibleDate(stayMatch[1]);
    checkOut = parseFlexibleDate(stayMatch[2]);
  }

  if (!checkIn) {
    const checkInMatch = text.match(
      /(?:check[-_]in|arrival)(?:\s+date|\s+time)?\s*[:*]*\s*([A-Za-z0-9 ',\-\/\.]{6,30}?)(?=\s+(?:check[-_]out|departure|nights|room|hotel|guest|12:00|11:00|$))/i
    );
    if (checkInMatch?.[1]) checkIn = parseFlexibleDate(checkInMatch[1]);
  }

  if (!checkOut) {
    const checkOutMatch = text.match(
      /(?:check[-_]out|departure)(?:\s+date|\s+time)?\s*[:*]*\s*([A-Za-z0-9 ',\-\/\.]{6,30}?)(?=\s*(?:\(|nights|room|hotel|guest|occupancy|rate|meal|total|11:00|12:00|$))/i
    );
    if (checkOutMatch?.[1]) checkOut = parseFlexibleDate(checkOutMatch[1]);
  }

  // 5. Financial Breakdown (Priority-ordered so Room Charges never shadows Total Amount or Net Payout!)
  const extractMoney = (patterns: RegExp[]): number | null => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) return val;
      }
    }
    return null;
  };

  const grossAmount = extractMoney([
    /(?:total\s+amount|booking\s+amount|sell\s+inclusive\s+amount|reference\s+sell\s+rate(?:\s*\([^)]*\))?|property\s+gross\s+charges(?:\s*\([^)]*\))?|grand\s+total|total\s+charged\s+amount)\s*[:*]*\s*(?:inr|rs\.?|₹|\$|usd|eur)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const netPayout = extractMoney([
    /(?:amount\s+payable\s+to\s+hotel|net\s+payable\s+to\s+hotel|payable\s+to\s+property(?:\s*\([^)]*\))?|payable\s+to\s+hotel|net\s+payout|hotel\s+payout)\s*[:*]*\s*(?:inr|rs\.?|₹|\$|usd|eur)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /net\s+rate(?:\s*\([^)]*\))?\s*[:*]*\s*(?:inr|rs\.?|₹|\$|usd|eur)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const roomCharges = extractMoney([
    /(?:room\s+charges|room\s+rate)\s*[:*]*\s*(?:inr|rs\.?|₹|\$|usd|eur)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const taxAmount = extractMoney([
    /taxes(?:\s*\([^)]*\))?\s*[:*]*\s*(?:inr|rs\.?|₹|\$|usd|eur)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const commissionAmount = extractMoney([
    /(?:^|\s)commission\s*[:*]+\s*(?:inr|rs\.?|₹|\$|usd|eur)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const fallbackAmount = extractMoney([
    /INR\s+([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:inr|rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]);

  const amount = grossAmount ?? netPayout ?? roomCharges ?? fallbackAmount;

  const paymentModeMatch = text.match(
    /(?:Payment\s+type|Payment\s+mode|Payment\s+model)\s*[:*]+\s*([A-Za-z0-9@() \-]+?)(?=\s+(?:Special\s+request|Please\s+note|Sent\s+with|$))/i
  );
  const paymentMode = paymentModeMatch?.[1]?.trim() || null;

  // 6. Room Category & Room Count
  let roomCategory: string | null = null;
  let roomsCount = 1;

  // e.g. "Room type: Premium Valley View" or "Room category: Family Suite"
  const roomTypeMatch = text.match(
    /(?:Room\s+type|Room\s+category|Category)\s*[:*]+\s*([A-Za-z0-9 \-\/&]+?)(?=\s+(?:Rooms|Occupancy|Guests|Meal|Rate|Benefits|Check|Nights|$))/i
  );
  if (roomTypeMatch?.[1]) {
    roomCategory = roomTypeMatch[1].trim();
  }

  // e.g. "1 x Premium Room" (Goibibo Hotelier Voucher)
  if (!roomCategory) {
    const xRoomMatch = text.match(
      /(\d+)\s*x\s*([A-Za-z0-9 \-\/&]+?)(?=\s+\d+\s*Adults|\s+Inclusions|\s+Rate|$)/i
    );
    if (xRoomMatch?.[2]) {
      roomsCount = Math.max(1, parseInt(xRoomMatch[1], 10) || 1);
      roomCategory = xRoomMatch[2].trim();
    }
  }

  // e.g. "Room: 1 Standard Room for 2 adults, with breakfast included"
  if (!roomCategory) {
    const inlineRoomMatch = text.match(
      /Room\s*[:*]+\s*(\d+)\s+([A-Za-z0-9 \-\/&]+?)(?:\s+for\s+\d+|\s*,|\s+Booking|$)/i
    );
    if (inlineRoomMatch?.[2]) {
      roomsCount = Math.max(1, parseInt(inlineRoomMatch[1], 10) || 1);
      roomCategory = inlineRoomMatch[2].trim();
    }
  }

  const roomsCountMatch = text.match(/Rooms\s*[:*]+\s*(\d+)/i);
  if (roomsCountMatch?.[1]) {
    roomsCount = Math.max(1, parseInt(roomsCountMatch[1], 10) || 1);
  }

  // 7. Adults & Children
  let adults = 2;
  let children = 0;

  const adultsMatch = text.match(/(\d+)\s*adults?/i);
  if (adultsMatch?.[1]) {
    adults = Math.max(1, parseInt(adultsMatch[1], 10) || 2);
  }
  const childrenMatch = text.match(/(\d+)\s*child(?:ren)?/i);
  if (childrenMatch?.[1]) {
    children = Math.max(0, parseInt(childrenMatch[1], 10) || 0);
  }

  // 8. Meal Plan
  let mealPlan: 'RO' | 'CP' | 'MAP' | 'AP' = 'RO';
  const mealText = text.toLowerCase();
  if (/\bap\b|all\s+meals|full\s+board/i.test(mealText)) {
    mealPlan = 'AP';
  } else if (/\bmap\b|half\s+board|breakfast\s+and\s+dinner/i.test(mealText)) {
    mealPlan = 'MAP';
  } else if (/\bcp\b|breakfast\s+included|with\s+breakfast|complimentary\s+breakfast/i.test(mealText)) {
    mealPlan = 'CP';
  } else if (/\bro\b|room\s+only/i.test(mealText)) {
    mealPlan = 'RO';
  }

  // 9. Special Requests
  let specialRequests: string | null = null;
  const reqMatch = text.match(
    /(?:Special\s+request[s]?|Guest\s+request[s]?)\s*[:*]+\s*([^.\n]{3,160}\.?)(?=\s+(?:Previous\s+stay|Booking|Payment|$)|$)/i
  );
  if (reqMatch?.[1]) {
    specialRequests = reqMatch[1].trim();
  }

  // 10. Prepaid check
  const isPrepaid = /prepaid|paid\s+online|pay@mmt|agoda\s+collect|pre-paid|already\s+paid/i.test(text);

  return {
    guestName,
    guestEmail,
    guestPhone,
    checkIn,
    checkOut,
    amount,
    grossAmount,
    netPayout,
    roomCharges,
    taxAmount,
    commissionAmount,
    paymentMode,
    source: source || 'Direct',
    roomCategory,
    roomsCount,
    adults,
    children,
    mealPlan,
    specialRequests,
    isPrepaid,
  };
}

export function matchRoomTypeFromCategory(
  roomCategory: string | null | undefined,
  roomTypes: Array<{ id: string; name: string; code?: string; baseRate?: number }>
): { id: string; name: string } | null {
  if (!roomTypes || roomTypes.length === 0) return null;
  if (!roomCategory) return roomTypes[0];

  const cat = roomCategory.toLowerCase().trim();

  // 1. Exact or substring match
  const direct = roomTypes.find(
    (rt) =>
      rt.name.toLowerCase() === cat ||
      rt.name.toLowerCase().includes(cat) ||
      cat.includes(rt.name.toLowerCase().replace(/\s+room$/i, '').trim())
  );
  if (direct) return direct;

  // 2. Keyword matching
  if (cat.includes('suite') || cat.includes('family') || cat.includes('villa') || cat.includes('presidential')) {
    const suite = roomTypes.find((rt) => /suite|family|villa/i.test(rt.name));
    if (suite) return suite;
  }

  if (
    cat.includes('super') ||
    cat.includes('premium') ||
    cat.includes('valley') ||
    cat.includes('executive') ||
    cat.includes('club') ||
    cat.includes('luxury')
  ) {
    const superDeluxe = roomTypes.find((rt) => /super\s*deluxe|premium|executive|club/i.test(rt.name));
    if (superDeluxe) return superDeluxe;
  }

  if (cat.includes('deluxe') || cat.includes('standard') || cat.includes('classic') || cat.includes('superior')) {
    const deluxe = roomTypes.find((rt) => /deluxe|standard/i.test(rt.name) && !/super/i.test(rt.name));
    if (deluxe) return deluxe;
  }

  return roomTypes[0];
}

export function getAvailableRoomsForCategory(
  roomTypeId: string,
  rooms: Array<{ id: string; roomNumber: string; roomTypeId: string; status: string }>,
  activeBookings: Array<any> = [],
  checkIn?: string | Date | null,
  checkOut?: string | Date | null
) {
  const ci = checkIn ? new Date(checkIn).getTime() : null;
  const co = checkOut ? new Date(checkOut).getTime() : null;

  const busyRoomIds = new Set<string>();
  if (ci && co && !isNaN(ci) && !isNaN(co)) {
    activeBookings.forEach((b) => {
      if (b.isEmailBooking || b.isStandaloneAgentBooking) return;
      if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT' || b.status === 'NO_SHOW') return;
      const bStart = new Date(b.arrivalDate).getTime();
      const bEnd = new Date(b.departureDate).getTime();
      if (ci < bEnd && co > bStart) {
        if (b.assignedRoomId) busyRoomIds.add(b.assignedRoomId);
        (b.rooms || []).forEach((r: any) => {
          if (r.roomId) busyRoomIds.add(r.roomId);
          if (r.room?.id) busyRoomIds.add(r.room.id);
        });
      }
    });
  }

  return rooms
    .filter((r) => !roomTypeId || r.roomTypeId === roomTypeId)
    .map((r) => {
      const isDateBusy = busyRoomIds.has(r.id);
      const isStatusAvailable = r.status === 'AVAILABLE';
      return {
        ...r,
        isReady: isStatusAvailable && !isDateBusy,
        isDateBusy,
      };
    })
    .sort((a, b) => {
      if (a.isReady !== b.isReady) return a.isReady ? -1 : 1;
      return String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true });
    });
}
