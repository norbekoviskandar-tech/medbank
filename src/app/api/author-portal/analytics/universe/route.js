import { NextResponse } from 'next/server';
import { getProductUniverseAnalytics } from '@/lib/server-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');
    
    if (!packageId) {
      return NextResponse.json({ error: 'packageId required' }, { status: 400 });
    }
    
    const analytics = getProductUniverseAnalytics(packageId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Universe analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch universe analytics' }, { status: 500 });
  }
}
