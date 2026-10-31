import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentPhone,
      agentName,
      companyName,
      agentCode,
      hotelName,
      groupName,
      totalPax,
      checkIn,
      checkOut,
      roomsSummary,
      mealPlan,
      grandTotal,
      commission,
      netPayable,
      propertyId,
      bookingRef,
      itinerarySummary,
      transportSummary,
    } = body;

    if (!agentPhone) {
      return NextResponse.json(
        { success: false, message: 'Agent WhatsApp phone number is required.' },
        { status: 400 }
      );
    }

    const cleanMobile = agentPhone.replace(/[^0-9]/g, '');
    const ref = bookingRef || `GRP-${Date.now().toString().slice(-6)}`;

    // Build professional, formatted English Master Invoice
    const messageLines = [
      `🏨 *OFFICIAL MASTER INVOICE & TRIP MANIFEST*`,
      `*${hotelName || 'Partner Hotel'}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📄 *Invoice No:* #${ref}`,
      `👤 *Billed To (Travel Agent):* ${agentName || 'Valued Partner'}${companyName ? ` (${companyName})` : ''}`,
      `🏷️ *Agent Code:* ${agentCode || 'N/A'}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👥 *Group / Tour:* ${groupName || 'Group Tour'}`,
      `🔢 *Total Guests:* ${totalPax || '1'} Pax`,
      `📅 *Stay Dates:* ${checkIn || 'N/A'} to ${checkOut || 'N/A'}`,
      `🛏️ *Rooms Booked:* ${roomsSummary || 'Standard Group Accommodation'}`,
      mealPlan ? `🍽️ *Meal Package:* ${mealPlan}` : '',
      transportSummary ? `🚗 *Transport Details:* ${transportSummary}` : '',
      itinerarySummary ? `📍 *Itinerary:* ${itinerarySummary}` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *Total Package Value:* ₹${Number(grandTotal || 0).toLocaleString('en-IN')}`,
      `🎁 *Agent Commission Deducted:* -₹${Number(commission || 0).toLocaleString('en-IN')}`,
      `*★ NET AMOUNT PAYABLE BY AGENT:* ₹${Number(netPayable || 0).toLocaleString('en-IN')}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `✅ *Payment Terms:* As per Travel Agent Agreement.`,
      `For queries, please contact hotel reservations.`,
      `Thank you for partnering with us! 🙏`,
    ].filter(Boolean);

    const message = messageLines.join('\n');

    const result = await sendWhatsAppMessage({
      mobile: cleanMobile,
      message,
      propertyId: propertyId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Master Invoice successfully sent to Agent WhatsApp (+${cleanMobile})!`,
      data: result,
    });
  } catch (error: any) {
    console.error('[Agent Send Invoice Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to dispatch WhatsApp invoice' },
      { status: 500 }
    );
  }
}

