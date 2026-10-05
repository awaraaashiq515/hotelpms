import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerateRequest {
  ratings: {
    cleanliness?: number;
    food?: number;
    service?: number;
    overall?: number;
  };
  hotelName?: string;
  guestName?: string;
  style?: 'WARM_DETAILED' | 'CONCISE' | 'FAMILY' | 'BUSINESS' | 'FOOD_LOVER' | 'HINGLISH';
}

function generateSmartFallback(
  ratings: { cleanliness?: number; food?: number; service?: number; overall?: number },
  hotelName: string,
  style: string
): string {
  const c = ratings.cleanliness || 5;
  const f = ratings.food || 5;
  const s = ratings.service || 5;
  const o = ratings.overall || 5;

  const hName = hotelName || 'this hotel';

  if (style === 'HINGLISH') {
    if (o >= 4) {
      const parts = [
        `${hName} mein humara stay bohot hi shandar aur memorable raha!`,
        c >= 4 ? 'Rooms ekdum clean aur comfortable the.' : '',
        s >= 4 ? 'Yahan ka staff bohot polite, welcoming aur helpful hai.' : '',
        f >= 4 ? 'Khana bohot tasty aur fresh tha, breakfast buffet zabardast laga!' : '',
        'Sabhi travelers aur families ko strongly recommend karunga. 5/5 stars!'
      ];
      return parts.filter(Boolean).join(' ');
    } else {
      return `${hName} ka overall experience theek-thaak raha. Staff supportive tha, lekin kuch service aur amenities ko aur behtar banaya ja sakta hai.`;
    }
  }

  if (style === 'CONCISE') {
    if (o >= 4) {
      const highlights: string[] = [];
      if (c >= 4) highlights.push('spotless rooms');
      if (s >= 4) highlights.push('courteous staff');
      if (f >= 4) highlights.push('delicious food');
      return `Outstanding experience at ${hName}! Loved the ${highlights.join(', ')}. Seamless check-in and great hospitality. Highly recommended!`;
    }
    return `Decent stay at ${hName}. Clean rooms and good location, though a few services could be improved.`;
  }

  if (style === 'FAMILY') {
    return `We visited with family and had a delightful experience at ${hName}. The rooms were spacious, immaculately cleaned, and child-friendly. The staff went out of their way to assist us with a smile, and the dining was wholesome and tasty. Will definitely stay here again on our next trip!`;
  }

  if (style === 'BUSINESS') {
    return `Stayed at ${hName} for a business trip. Prompt service, spotless room, comfortable desk setup, and high-speed Wi-Fi made my work smooth. The staff was professional and food was served fresh and on time. Perfect choice for corporate travelers.`;
  }

  if (style === 'FOOD_LOVER') {
    return `An absolute treat of a stay at ${hName}! The culinary spread was simply exceptional — loved the rich flavors, fresh spreads, and warm dining service. Paired with clean and cozy rooms, it made our trip unforgettable. Big kudos to the chefs and staff!`;
  }

  // Default: WARM_DETAILED
  const points: string[] = [];
  if (c >= 4) points.push('The rooms were pristine, beautifully maintained, and very cozy.');
  if (s >= 4) points.push('The hospitality of the staff was top-tier — always attentive, polite, and quick to help.');
  if (f >= 4) points.push('The dining and buffet spreads were delicious with great variety and fresh ingredients.');

  return `Had an exceptional stay at ${hName}! ${points.join(' ')} Everything exceeded our expectations. Truly a 5-star experience from arrival to departure. Can't wait to visit again!`;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { ratings = {}, hotelName = 'the hotel', guestName = 'Guest', style = 'WARM_DETAILED' } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are helping a hotel guest write an authentic, high-converting Google Maps review for their stay at "${hotelName}".
Guest Name: ${guestName}
Ratings given by guest:
- Cleanliness: ${ratings.cleanliness || 5}/5
- Food & Dining: ${ratings.food || 5}/5
- Staff Service: ${ratings.service || 5}/5
- Overall: ${ratings.overall || 5}/5
Tone / Style requested: ${style}

Instructions:
1. Write a natural, genuine-sounding Google review (2 to 4 sentences).
2. Highlight the areas with high ratings (cleanliness, hospitality, food).
3. Do NOT use buzzwords like "unparalleled luxury" or sound like an advertisement. Write like a real happy guest.
4. Output ONLY the review text directly, no quotes, no extra formatting.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/^["']|["']$/g, '');
        if (text) {
          return NextResponse.json({ success: true, reviewText: text });
        }
      } catch (err) {
        console.warn('Gemini API call skipped or failed, falling back to smart engine:', err);
      }
    }

    // Smart contextual engine
    const fallbackText = generateSmartFallback(ratings, hotelName, style);
    return NextResponse.json({
      success: true,
      reviewText: fallbackText,
    });
  } catch (error: any) {
    console.error('Error generating AI review:', error);
    return NextResponse.json(
      { success: false, message: 'Could not generate review' },
      { status: 500 }
    );
  }
}
