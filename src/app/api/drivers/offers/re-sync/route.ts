import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { syncDriverProgression } from '@/lib/incentive-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId: bodyPropertyId } = await request.json();
    const propertyId = session.propertyId || bodyPropertyId;

    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    const result = await syncDriverProgression(propertyId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Re-Sync API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to re-sync engine data.', 
      error: error.message 
    }, { status: 500 });
  }
}
