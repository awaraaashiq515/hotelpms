import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename } = await params;
    const fullFilename = filename.join('/');
    console.log('Serving image:', fullFilename);
    
    const path = join(process.cwd(), 'public/uploads', fullFilename);
    console.log('Full path:', path);

    if (!existsSync(path)) {
      console.log('File not found at path:', path);
      return new NextResponse('Not Found', { status: 404 });
    }

    const fileBuffer = await readFile(path);
    
    // Determine content type based on extension
    const ext = fullFilename.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
    };
    
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
