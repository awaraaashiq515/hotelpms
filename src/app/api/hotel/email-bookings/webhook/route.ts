import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');

    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'Missing apiKey parameter' }, { status: 401 });
    }

    const payload = await request.json();
    const { to, from, subject, text, html } = payload;

    if (!to || !subject) {
      return NextResponse.json({ success: false, message: 'Missing required email fields (to, subject)' }, { status: 400 });
    }

    // Clean email from format like "Hotel Royal <royal@gmail.com>" to "royal@gmail.com"
    const cleanToEmail = to.replace(/.*<|>.*/g, '').trim().toLowerCase();

    // Look up the property with matching bookingEmail and bookingEmailParserApiKey
    const property = await prisma.property.findFirst({
      where: {
        bookingEmail: {
          equals: cleanToEmail
        },
        bookingEmailParserApiKey: apiKey
      }
    });

    if (!property) {
      return NextResponse.json({ success: false, message: 'Property not found or unauthorized' }, { status: 404 });
    }

    const emailBody = text || html || '';
    const emailSender = from || '';

    // 1. Detect Booking Source
    let source = 'Direct';
    if (/agoda/i.test(subject) || /agoda/i.test(emailBody)) {
      source = 'Agoda';
    } else if (/booking\.com/i.test(subject) || /booking\.com/i.test(emailBody)) {
      source = 'Booking.com';
    } else if (/airbnb/i.test(subject) || /airbnb/i.test(emailBody)) {
      source = 'Airbnb';
    }

    // 2. Parse Guest Name
    let guestName = 'Unknown Guest';
    const guestNamePatterns = [
      /(?:guest|customer|client|name):\s*([A-Za-z\s]+)(?:\n|\r)/i,
      /(?:reservation|booking)\s+(?:for|by)\s+([A-Za-z\s]{3,35})/i,
      /booking\s*confirmation\s*-\s*([A-Za-z\s]{3,35})/i
    ];
    for (const pattern of guestNamePatterns) {
      const match = emailBody.match(pattern) || subject.match(pattern);
      if (match && match[1]) {
        guestName = match[1].trim();
        break;
      }
    }

    // 3. Parse Dates
    let checkIn: Date | null = null;
    let checkOut: Date | null = null;

    const checkInMatch = emailBody.match(/(?:check-in|checkin|arrival|in|date of arrival):\s*([A-Za-z0-9\s,\-\/]{6,25})/i);
    if (checkInMatch && checkInMatch[1]) {
      const parsedIn = new Date(checkInMatch[1].trim());
      if (!isNaN(parsedIn.getTime())) checkIn = parsedIn;
    }

    const checkOutMatch = emailBody.match(/(?:check-out|checkout|departure|out|date of departure):\s*([A-Za-z0-9\s,\-\/]{6,25})/i);
    if (checkOutMatch && checkOutMatch[1]) {
      const parsedOut = new Date(checkOutMatch[1].trim());
      if (!isNaN(parsedOut.getTime())) checkOut = parsedOut;
    }

    // 4. Parse Amount
    let amount: number | null = null;
    const amountMatch = emailBody.match(/(?:total|price|amount|grand total|paid|cost):\s*(?:rs\.?|inr|₹|\$|usd)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
    if (amountMatch && amountMatch[1]) {
      const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(parsedAmount)) amount = parsedAmount;
    }

    // 5. Parse Guest Contact details
    let guestEmail: string | null = null;
    let guestPhone: string | null = null;

    const emailMatch = emailBody.match(/(?:email):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch && emailMatch[1]) {
      guestEmail = emailMatch[1].trim();
    }

    const phoneMatch = emailBody.match(/(?:phone|mobile|tel):\s*([+\d\s-]{8,15})/i);
    if (phoneMatch && phoneMatch[1]) {
      guestPhone = phoneMatch[1].trim();
    }

    // Save Email Booking log
    const emailBooking = await prisma.emailBooking.create({
      data: {
        propertyId: property.id,
        sender: emailSender,
        subject,
        body: emailBody,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        amount,
        source,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully',
      data: emailBooking
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
