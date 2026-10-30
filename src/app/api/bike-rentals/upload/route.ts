import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
 
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Ensure public/uploads directory exists
    const uploadDir = join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 1. Multipart Form Data (file upload from mobile camera or gallery)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file received' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine extension
      const originalName = file.name || 'vehicle.jpg';
      const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `bike-${Date.now()}-${cleanName}`;
      const filePath = join(uploadDir, filename);

      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        message: 'Vehicle image uploaded successfully',
        url: `/api/images/${filename}`,
        filename,
      });
    }

    // 2. JSON Body (e.g. base64 image or direct url)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { image, filename: customName } = body;

      if (!image) {
        return NextResponse.json({ success: false, message: 'Image data missing' }, { status: 400 });
      }

      // If already a URL, return it
      if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/api/images/'))) {
        return NextResponse.json({ success: true, url: image });
      }

      // If base64 data URL
      if (typeof image === 'string' && image.startsWith('data:image/')) {
        const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return NextResponse.json({ success: false, message: 'Invalid base64 image format' }, { status: 400 });
        }

        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const filename = `bike-${Date.now()}-${customName ? customName.replace(/[^a-zA-Z0-9]/g, '_') : 'photo'}.${ext}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);

        return NextResponse.json({
          success: true,
          message: 'Vehicle image uploaded successfully',
          url: `/api/images/${filename}`,
          filename,
        });
      }

      return NextResponse.json({ success: false, message: 'Unsupported image format' }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Unsupported content type' }, { status: 400 });
  } catch (error: any) {
    console.error('Bike image upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Image upload failed' }, { status: 500 });
  }
}
