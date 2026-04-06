import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET /api/gst/download/[filingId]
// Returns the JSON file as a downloadable attachment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { filingId } = await params;

    const filing = await prisma.gstFiling.findFirst({
      where: {
        id: filingId,
        propertyId: session.propertyId!,
      },
      include: {
        property: {
          include: {
            organization: { select: { gstNumber: true } }
          }
        }
      }
    });

    if (!filing) return apiError(new Error('Filing not found'), 404);

    // Parse the JSON to re-stringify with proper formatting
    let jsonContent: string;
    try {
      const parsed = JSON.parse(filing.jsonData);
      jsonContent = JSON.stringify(parsed, null, 2);
    } catch {
      jsonContent = filing.jsonData;
    }

    // Filename: GSTIN_GSTR1_032026.json
    const gstin = filing.property?.organization?.gstNumber || 'GSTIN';
    const filename = `${gstin}_${filing.returnType.replace('-', '')}_${filing.filingMonth}.json`;

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(jsonContent, 'utf8').toString(),
      }
    });

  } catch (error) {
    console.error('GST Download Error:', error);
    return apiError(error);
  }
}
