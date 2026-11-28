import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { parseEmailBookingDetails } from '@/lib/email-booking-parser';

function parseBookingData(subject: string, rawText: string) {
  const parsed = parseEmailBookingDetails(subject, rawText);
  return {
    guestName: parsed.guestName,
    guestEmail: parsed.guestEmail,
    guestPhone: parsed.guestPhone,
    checkIn: parsed.checkIn,
    checkOut: parsed.checkOut,
    amount: parsed.amount,
    source: parsed.source,
  };
}

function isBookingEmail(subject: string, text: string): boolean {
  const content = `${subject} ${text}`.toLowerCase();
  const otaNames = [
    'agoda', 'booking.com', 'airbnb', 'makemytrip', 'mmt', 'goibibo',
    'expedia', 'yatra', 'easemytrip', 'cleartrip', 'trivago', 'travelguru'
  ];
  const hasOta = otaNames.some(ota => content.includes(ota));

  const bookingKeywords = [
    'booking confirmation', 'reservation confirmed', 'booking confirmed',
    'new reservation', 'your reservation', 'booking details', 'stay details',
    'check-in details', 'check in confirmation', 'hotel booking',
    'room confirmation', 'new booking', 'booking id', 'reservation id',
    'hotel reservation', 'booking reference', 'booking cancelled',
    'stay voucher', 'guest itinerary', 'reservation voucher', 'voucher id',
    'reservation notification', 'check-in voucher'
  ];
  const hasKeyword = bookingKeywords.some(k => content.includes(k));

  if (hasKeyword) return true;
  if (hasOta && (content.includes('booking') || content.includes('reservation') || content.includes('check-in') || content.includes('guest') || content.includes('voucher'))) {
    return true;
  }
  return false;
}

export async function syncGmailForProperty(propertyId: string): Promise<{ synced: number; errors: string[] }> {
  const property = await prisma.property.findFirst({
    where: {
      OR: [
        { id: propertyId },
        { code: propertyId }
      ]
    },
    select: {
      id: true,
      name: true,
      bookingEmail: true,
      gmailAppPassword: true,
    }
  });

  console.log('[DEBUG] syncGmailForProperty called for id/code:', propertyId, 'Retrieved property:', JSON.stringify(property));

  if (!property?.bookingEmail || !property?.gmailAppPassword) {
    return { synced: 0, errors: ['Gmail credentials not configured for this property'] };
  }

  return new Promise((resolve) => {
    const errors: string[] = [];
    let syncedCount = 0;

    const cleanEmail = property.bookingEmail!.trim();
    const cleanPassword = property.gmailAppPassword!.replace(/\s+/g, '');

    const imap = new Imap({
      user: cleanEmail,
      password: cleanPassword,
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

        const executeFetch = (uids: number[]) => {
          if (!uids || uids.length === 0) {
            imap.end();
            return resolve({ synced: 0, errors: [] });
          }

          // Process the most recent 50 emails
          const uidsToFetch = uids.slice(-50);
          console.log(`[DEBUG] Fetching ${uidsToFetch.length} emails in one batch...`);

          // ── PHASE 1: Collect ALL raw email bodies into memory (no DB calls yet) ──
          interface RawEmail {
            subject: string;
            text: string;
            sender: string;
            date: Date | null;
          }
          const rawEmails: RawEmail[] = [];
          const streamPromises: Promise<void>[] = [];

          const fetch = imap.fetch(uidsToFetch, { bodies: '', markSeen: false });

          fetch.on('message', (msg) => {
            const streamDone = new Promise<void>((resStream) => {
              msg.on('body', (stream) => {
                simpleParser(stream as any, (parseErr, parsed: ParsedMail) => {
                  if (!parseErr) {
                    const htmlStr = typeof parsed.html === 'string' ? parsed.html : '';
                    rawEmails.push({
                      subject: parsed.subject || '',
                      text: parsed.text || htmlStr.replace(/<[^>]*>/g, ' ') || '',
                      sender: typeof parsed.from?.value?.[0]?.address === 'string'
                        ? parsed.from.value[0].address
                        : '',
                      date: parsed.date || null,
                    });
                  }
                  resStream();
                });
              });
            });
            streamPromises.push(streamDone);
          });

          fetch.once('end', async () => {
            // Wait for all IMAP streams to finish parsing
            await Promise.all(streamPromises);
            console.log(`[DEBUG] All ${rawEmails.length} emails parsed. Processing booking matches in parallel...`);

            // ── PHASE 2: Filter booking emails & run all DB operations in parallel ──
            const bookingEmails = rawEmails.filter(e => isBookingEmail(e.subject, e.text));
            console.log(`[DEBUG] ${bookingEmails.length} booking emails found out of ${rawEmails.length}`);

            const dbResults = await Promise.all(
              bookingEmails.map(async (email) => {
                const { subject, text, sender } = email;
                const booking = parseBookingData(subject, text);

                console.log('[DEBUG] Processing booking email:', subject, 'from:', sender, 'guest:', booking.guestName);

                // Extract booking reference ID (e.g. NH7HTNANMDH4A, GOKDVPT9G8FZYG, BK-984712)
                const bookingRefMatch = (subject + ' ' + text).match(
                  /(?:Booking\s+ID|Reservation\s+ID|Booking\s+Ref|Voucher\s+ID|#)\s*[:#]*\s*([A-Za-z0-9-]{6,25})/i
                );
                const bookingRef = bookingRefMatch?.[1];

                // Deduplication: 1. By booking reference ID
                let existing = null;
                if (bookingRef) {
                  existing = await prisma.emailBooking.findFirst({
                    where: {
                      propertyId: property.id,
                      OR: [
                        { subject: { contains: bookingRef } },
                        { body: { contains: bookingRef } },
                      ]
                    }
                  });
                }

                // Deduplication: 2. Fallback by subject + sender + guestName/checkIn
                if (!existing) {
                  existing = await prisma.emailBooking.findFirst({
                    where: {
                      propertyId: property.id,
                      subject,
                      sender,
                      ...(booking.guestName && booking.guestName !== 'Unknown Guest'
                        ? { guestName: booking.guestName }
                        : {}),
                      ...(booking.checkIn ? { checkIn: booking.checkIn } : {}),
                    }
                  });
                }

                // Update stale record if we now have a real guest name
                if (existing) {
                  if (
                    existing.guestName === 'Unknown Guest' &&
                    booking.guestName &&
                    booking.guestName !== 'Unknown Guest'
                  ) {
                    try {
                      await prisma.emailBooking.update({
                        where: { id: existing.id },
                        data: {
                          guestName: booking.guestName,
                          guestEmail: booking.guestEmail || existing.guestEmail,
                          guestPhone: booking.guestPhone || existing.guestPhone,
                          checkIn: booking.checkIn || existing.checkIn,
                          checkOut: booking.checkOut || existing.checkOut,
                          amount: booking.amount || existing.amount,
                          source: booking.source || existing.source,
                        }
                      });
                    } catch { /* ignore */ }
                  }
                  return false; // already exists
                }

                // New record — create it
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
                  return true; // synced
                } catch (dbErr: any) {
                  errors.push(`DB error: ${dbErr.message}`);
                  return false;
                }
              })
            );

            syncedCount = dbResults.filter(r => r === true).length;
            console.log(`[DEBUG] Sync complete. ${syncedCount} new bookings saved.`);
            imap.end();
            resolve({ synced: syncedCount, errors });
          });

          fetch.once('error', (fetchErr) => {
            errors.push(`Fetch error: ${fetchErr.message}`);
            imap.end();
            resolve({ synced: syncedCount, errors });
          });
        };

        // Search: Search ALL recent emails within last 30 days (both SEEN and UNSEEN)
        // so no booking emails are skipped if already opened on mobile/web!
        const searchCriteria = [
          ['SINCE', dateStr]
        ];

        imap.search(searchCriteria as any, (searchErr, uids) => {
          if (searchErr || !uids || uids.length === 0) {
            // Fallback: search ALL without date filter
            imap.search(['ALL'], (allErr, allUids) => {
              if (allErr || !allUids || allUids.length === 0) {
                imap.end();
                return resolve({ synced: 0, errors: searchErr ? [searchErr.message] : [] });
              }
              executeFetch(allUids);
            });
            return;
          }
          console.log(`[DEBUG] Found ${uids.length} emails since ${dateStr}.`);
          executeFetch(uids);
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
