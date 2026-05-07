import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/session';

/**
 * Generates a simple SVG captcha without external dependencies or font files.
 * This avoids 'ENOENT' errors during Next.js builds.
 */
function generateCaptcha() {
  // Generate a random math question
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const isAddition = Math.random() > 0.5;
  
  const question = isAddition ? `${num1} + ${num2}` : `${num1} - ${num2}`;
  const answer = isAddition ? num1 + num2 : num1 - num2;
  const code = answer.toString();

  // Create a professional "Security Question" look
  const svg = `
    <svg width="120" height="48" viewBox="0 0 120 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f1f5f9;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#mathGrad)" rx="12" />
      
      {/* Subtle Security Background */}
      <text x="5" y="15" font-family="monospace" font-size="8" fill="#e2e8f0" opacity="0.5">MATH_SEC_V2</text>
      <line x1="0" y1="24" x2="120" y2="24" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2 2" />
      
      {/* The Question */}
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="16" 
        font-weight="900" 
        fill="#1e293b"
      >
        ${question} = ?
      </text>
      
      <rect width="118" height="46" x="1" y="1" rx="11" fill="none" stroke="#cbd5e1" stroke-width="1.5" />
    </svg>
  `;

  return { code, svg };
}

export async function GET() {
  const { code, svg } = generateCaptcha();

  // Encrypt the captcha text and store in a short-lived cookie
  const payload = { text: code.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 60 * 5 };
  const encryptedCaptcha = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set('captcha', encryptedCaptcha, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5, // 5 minutes
  });

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
