import { NextResponse } from 'next/server';
import { reviseQuestion } from '@/lib/db/questions.repo';

export async function POST(request) {
  try {
    const { versionId, userId, notes } = await request.json();
    if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 });

    const newDraft = reviseQuestion(versionId, userId, notes);
    return NextResponse.json(newDraft);
  } catch (error) {
    console.error('Revise question error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
