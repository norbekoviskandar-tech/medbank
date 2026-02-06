import { NextResponse } from 'next/server';
import { getQuestionById } from '@/lib/server-db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const question = getQuestionById(id);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Get question by ID error:', error);
    return NextResponse.json({ error: 'Failed to get question' }, { status: 500 });
  }
}
