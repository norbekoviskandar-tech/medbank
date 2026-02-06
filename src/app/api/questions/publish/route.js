import { NextResponse } from 'next/server';
import { publishQuestion } from '@/lib/server-db';

export async function POST(request) {
  try {
    const { versionId } = await request.json();
    if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 });

    publishQuestion(versionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Publish question error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
