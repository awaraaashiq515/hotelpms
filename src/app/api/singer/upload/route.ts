import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { jwtVerify } from 'jose';
import fs from 'fs';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function verifySinger(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload && payload.type === 'SINGER_PORTAL';
  } catch (err) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await verifySinger(request);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    // Ensure public/uploads directory exists
    const uploadDir = join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const path = join(uploadDir, filename);
    await writeFile(path, buffer);
    console.log('[Singer Upload] Saved file to:', path);

    return NextResponse.json({ 
      success: true, 
      url: `/api/images/${filename}` 
    });
  } catch (error: any) {
    console.error('[Singer Upload Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server upload error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
