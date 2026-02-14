import { NextResponse } from 'next/server';
import { createNotification, createUserFeedback, getFeedback, getUserById, getUserFeedback, getUserUsageSummary } from '@/lib/db/users.repo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Number(searchParams.get('limit') || (userId ? 100 : 200));

    if (userId) {
      const feedback = getUserFeedback(userId, limit);
      const usage = getUserUsageSummary(userId);
      return NextResponse.json({ feedback, usage });
    }

    const feedback = getFeedback(limit);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, message, source = 'portal', questionId = null, testId = null, page = null } = body || {};

    const cleanMessage = String(message || '').trim();

    if (!userId || !cleanMessage) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
    }

    if (cleanMessage.length > 500) {
      return NextResponse.json({ error: 'Feedback is limited to 500 characters' }, { status: 400 });
    }

    const feedback = createUserFeedback({
      userId,
      message: cleanMessage,
      source,
      questionId,
      testId,
      page
    });

    const user = getUserById(userId);
    const sourceLabel = source === 'test_session' ? 'Test Session' : source === 'create_test' ? 'Create Test' : 'Portal';
    const questionSuffix = questionId ? ` [QID: ${questionId}]` : '';

    createNotification(
      'feedback',
      `New feedback from ${user?.name || 'Student'} (${user?.email || userId}) via ${sourceLabel}${questionSuffix}`,
      userId,
      {
        source,
        questionId: questionId ? String(questionId) : null,
        testId: testId ? String(testId) : null,
        page: page || null,
        snippet: cleanMessage.slice(0, 160)
      }
    );

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
