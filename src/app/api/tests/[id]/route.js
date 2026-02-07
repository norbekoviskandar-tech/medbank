import { NextResponse } from 'next/server';
import { getTestById } from '@/lib/server-db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');

    // 1. Try to fetch as a Test Attempt first (New behavior)
    const { getTestAttempt } = await import('@/lib/server-db');
    const attempt = getTestAttempt(id);
    if (attempt) {
      console.log(`[API] Returning test attempt ${id}`);
      return NextResponse.json(attempt);
    }

    // 2. Fallback to standard test lookup
    const test = getTestById(id, packageId || 'all');
    
    if (!test) {
      return NextResponse.json({ error: 'Test or Attempt not found' }, { status: 404 });
    }
    
    return NextResponse.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    return NextResponse.json({ error: 'Failed to get test' }, { status: 500 });
  }
}
