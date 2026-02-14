import { NextResponse } from 'next/server';
import { getUserProductStats } from '@/lib/db/users.repo';

// GET /api/student/stats?userId=xxx&packageId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const packageId = searchParams.get('packageId');

    if (!userId || !packageId) {
      return NextResponse.json({ error: 'userId and packageId are required' }, { status: 400 });
    }

    const stats = getUserProductStats(userId, packageId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get student stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch student statistics' }, { status: 500 });
  }
}
