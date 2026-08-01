import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { prisma } from '@/lib/prisma';

interface ParsedBookingData {
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  amount: number | null;
  source: string;
}

function detectSource(subject: string, text: string): string {
  const content = `${subject} ${text}`.toLowerCase();
  if (content.includes('agoda')) return 'Agoda';
  if (content.includes('booking.com')) return 'Booking.com';
  if (content.includes('airbnb')) return 'Airbnb';
  if (content.includes('makemytrip') || content.includes('mmt')) return 'MakeMyTrip';
  if (content.includes('goibibo')) return 'Goibibo';
  if (content.includes('expedia')) return 'Expedia';
  if (content.includes('trivago')) return 'Trivago';
  return 'Direct';
}

function parseBookingData(subject: string, text: string): ParsedBookingData {
  const source = detectSource(subject, text);
  
  let guestName: string | null = null;
  // Use [A-Za-z ] instead of [A-Za-z\s] to prevent matching across lines
  const firstNameMatch = text.match(/(?:First\s+Name|Customer\s+First\s+Name)\s*[:*]*\s*([A-Za-z ]+)/i);
  const lastNameMatch = text.match(/(?:Last\s+Name|Customer\s+Last\s+Name)\s*[:*]*\s*([A-Za-z ]+)/i);
  if (firstNameMatch?.[1]) {
    guestName = firstNameMatch[1].trim();
    if (lastNameMatch?.[1]) {
      guestName += ' ' + lastNameMatch[1].trim();
    }
  }
  if (!guestName || guestName.toLowerCase().includes('details')) {
    const nameMatch = text.match(/(?:Customer\s+Name|Guest\s+Name|Guest\s+1|Booked\s+By)\s*[:*]*\s*([A-Za-z ]+)/i);
    if (nameMatch?.[1]) guestName = nameMatch[1].trim();
  }
  if (!guestName || guestName.toLowerCase().includes('details')) {
    const dearMatch = text.match(/Dear\s+([A-Za-z ]{3,40})/i);
    if (dearMatch?.[1]) guestName = dearMatch[1].trim();
  }
  if (!guestName) {
    guestName = 'Unknown Guest';
  }

  let guestEmail: string | null = null;
  const emailMatch = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
  if (emailMatch) {
    const filtered = emailMatch.filter(e => !e.includes('agoda') && !e.includes('booking.com') && !e.includes('noreply') && !e.includes('vedika') && !e.includes('indeed'));
    if (filtered.length > 0) guestEmail = filtered[0];
  }

  let guestPhone: string | null = null;
  const phoneMatch = text.match(/(?:phone|mobile|contact|tel)\s*[:*]*\s*([+]?[\d\s\-()]{8,20})/i);
  if (phoneMatch?.[1]) {
    guestPhone = phoneMatch[1].replace(/[\s\-()]/g, '').trim();
  }

  let checkIn: Date | null = null;
  let checkOut: Date | null = null;

  // Use word boundaries for \bfrom\b and \bto\b, and literal space inside character set to avoid matching newlines
  const checkInMatch = text.match(/(?:check[-_]in|arrival|\bfrom\b)(?:\s+date|\s+time)?\s*[:*]*\s*([A-Za-z0-9 ,\-\/\.]{6,25})/i);
  if (checkInMatch?.[1]) {
    const d = new Date(checkInMatch[1].trim());
    if (!isNaN(d.getTime())) checkIn = d;
  }
  const checkOutMatch = text.match(/(?:check[-_]out|departure|\bto\b)(?:\s+date|\s+time)?\s*[:*]*\s*([A-Za-z0-9 ,\-\/\.]{6,25})/i);
  if (checkOutMatch?.[1]) {
    const d = new Date(checkOutMatch[1].trim());
    if (!isNaN(d.getTime())) checkOut = d;
  }

  let amount: number | null = null;
  // Handle optional middle words like (incl. taxes & fees) or newlines before currency
  const amountPatterns = [
    /(?:net\s+rate|total\s+amount|grand\s+total|total\s+charged\s+amount|room\s+rate)[\s\S]*?(?:inr|rs\.?|₹|\$|usd|eur)?[\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /INR\s+([0-9,]+(?:\.[0-9]{1,2})?)/i
  ];
  for (const p of amountPatterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        amount = val;
        break;
      }
    }
  }

  return { guestName, guestEmail, guestPhone, checkIn, checkOut, amount, source: source || 'Direct' };
}

function isBookingEmail(subject: string, text: string): boolean {
  const content = `${subject} ${text}`.toLowerCase();
  const bookingKeywords = [
    'booking confirmation', 'reservation confirmed', 'booking confirmed',
    'your reservation', 'booking details', 'stay details',
    'check-in details', 'check in confirmation', 'hotel booking',
    'room confirmation', 'new booking', 'booking id', 'reservation id',
    'hotel reservation', 'booking reference',
  ];
  return bookingKeywords.some(k => content.includes(k));
}

export async function syncGmailForProperty(propertyId: string): Promise<{ synced: number; errors: string[] }> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      bookingEmail: true,
      gmailAppPassword: true,
    }
  });

  console.log('[DEBUG] syncGmailForProperty called for id:', propertyId, 'Retrieved property:', JSON.stringify(property));

  if (!property?.bookingEmail || !property?.gmailAppPassword) {
    return { synced: 0, errors: ['Gmail credentials not configured for this property'] };
  }

  return new Promise((resolve) => {
    const errors: string[] = [];
    let syncedCount = 0;

    const imap = new Imap({
      user: property.bookingEmail!,
      password: property.gmailAppPassword!,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 5000,
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          errors.push(`Failed to open inbox: ${err.message}`);
          imap.end();
          return resolve({ synced: 0, errors });
        }

        // Search emails from last 30 days
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 30);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateStr = `${sinceDate.getDate()}-${months[sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;
        console.log('[DEBUG] IMAP Search DateStr:', dateStr);

        const searchCriteria = [
          'UNSEEN',
          ['SINCE', dateStr],
          ['OR', ['SUBJECT', 'Agoda'],
          ['OR', ['SUBJECT', 'Booking.com'],
          ['OR', ['SUBJECT', 'Airbnb'],
          ['OR', ['SUBJECT', 'Reservation'],
          ['OR', ['SUBJECT', 'Booking'], ['SUBJECT', 'Confirm']]]]]]
        ];

        imap.search(searchCriteria as any, async (searchErr, uids) => {
          console.log('[DEBUG] IMAP search results - UIDs:', uids, 'Error:', searchErr);
          if (searchErr || !uids || uids.length === 0) {
            imap.end();
            return resolve({ synced: 0, errors: searchErr ? [searchErr.message] : [] });
          }

          const fetch = imap.fetch(uids, { bodies: '' });
          const emailPromises: Promise<void>[] = [];

          fetch.on('message', (msg) => {
            const emailPromise = new Promise<void>((resEmail) => {
              msg.on('body', (stream) => {
                simpleParser(stream as any, async (parseErr, parsed: ParsedMail) => {
                  if (parseErr) { resEmail(); return; }

                  const subject = parsed.subject || '';
                  const htmlStr = typeof parsed.html === 'string' ? parsed.html : '';
                  const text = parsed.text || htmlStr.replace(/<[^>]*>/g, ' ') || '';
                  const sender = typeof parsed.from?.value?.[0]?.address === 'string' 
                    ? parsed.from.value[0].address 
                    : '';

                  const matched = isBookingEmail(subject, text);
                  console.log('[DEBUG] Processing email:', subject, 'from:', sender, 'isBookingEmail:', matched);

                  if (!matched) { resEmail(); return; }

                  // Check if already exists
                  const existing = await prisma.emailBooking.findFirst({
                    where: {
                      propertyId: property.id,
                      subject,
                      sender,
                    }
                  });

                  console.log('[DEBUG] Checked existing for', subject, 'Exists:', !!existing);

                  if (existing) { resEmail(); return; }

                  const booking = parseBookingData(subject, text);

                  try {
                    await prisma.emailBooking.create({
                      data: {
                        propertyId: property.id,
                        sender,
                        subject,
                        body: text.slice(0, 5000),
                        guestName: booking.guestName,
                        guestEmail: booking.guestEmail,
                        guestPhone: booking.guestPhone,
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                        amount: booking.amount,
                        source: booking.source,
                        status: 'PENDING',
                      }
                    });
                    syncedCount++;
                  } catch (dbErr: any) {
                    errors.push(`DB error: ${dbErr.message}`);
                  }

                  resEmail();
                });
              });
            });
            emailPromises.push(emailPromise);
          });

          fetch.once('end', async () => {
            await Promise.all(emailPromises);
            imap.end();
            resolve({ synced: syncedCount, errors });
          });

          fetch.once('error', (fetchErr) => {
            errors.push(`Fetch error: ${fetchErr.message}`);
            imap.end();
            resolve({ synced: syncedCount, errors });
          });
        });
      });
    });

    imap.once('error', (imapErr: Error) => {
      errors.push(`IMAP connection error: ${imapErr.message}`);
      resolve({ synced: 0, errors });
    });

    imap.connect();
  });
}

export async function syncAllProperties(): Promise<{ propertyId: string; name: string; synced: number; errors: string[] }[]> {
  const properties = await prisma.property.findMany({
    where: {
      bookingEmail: { not: null },
      gmailAppPassword: { not: null },
    },
    select: { id: true, name: true }
  });

  const results = [];
  for (const property of properties) {
    const result = await syncGmailForProperty(property.id);
    results.push({ propertyId: property.id, name: property.name, ...result });
  }

  return results;
}
