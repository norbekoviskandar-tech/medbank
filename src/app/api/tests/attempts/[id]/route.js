import { NextResponse } from 'next/server';
import { updateAttemptAnswer, updateAttemptFlag, snapshotAttempt, finishAttempt, updateAttemptReviewMetadata } from '@/lib/server-db';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, questionId, selectedOption, isFlagged, reviewMetadata, secondsToAdd } = body;

    if (type === 'review') {
      updateAttemptReviewMetadata(id, reviewMetadata);
      return NextResponse.json({ success: true });
    }

    if (type === 'answer') {
      if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 });
      // We send the 'secondsToAdd' to the DB to be added to the total
      updateAttemptAnswer(id, questionId, selectedOption, secondsToAdd || 0);
      return NextResponse.json({ success: true });
    }

    if (type === 'flag') {
      if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 });
      updateAttemptFlag(id, questionId, isFlagged);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (error) {
    console.error('Update attempt error:', error);
    return NextResponse.json({ error: 'Failed to update attempt' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, snapshot } = body || {};

    if (type === 'snapshot') {
      if (!snapshot) return NextResponse.json({ error: 'snapshot required' }, { status: 400 });
      snapshotAttempt(id, snapshot);
      return NextResponse.json({ success: true });
    }

    if (type === 'finish') {
      if (!snapshot) {
        return NextResponse.json({ error: 'snapshot required before finish' }, { status: 400 });
      }

      snapshotAttempt(id, snapshot);
      finishAttempt(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Post attempt error:', error);
    return NextResponse.json({ error: 'Failed to process attempt operation' }, { status: 500 });
  }
}
