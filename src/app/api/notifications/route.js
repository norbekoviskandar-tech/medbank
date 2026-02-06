import { NextResponse } from 'next/server';
import { getNotifications, markNotificationRead } from '@/lib/server-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const onlyUnread = searchParams.get('unread') === 'true';
    
    const notifications = getNotifications(limit, onlyUnread);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('API: Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    
    const success = markNotificationRead(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('API: Update notification error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
