import { NextResponse } from 'next/server';
import { getUserByEmail, createUser, createNotification } from '@/lib/server-db';
import crypto from 'crypto';

// Simple hash function (same as client-side for compatibility)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request) {
  try {
    const { name, email, password, role = 'student' } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const user = createUser({
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      role,
      subscriptionStatus: 'inactive',
      createdAt: new Date().toISOString(),
      stats: { attempted: 0, correct: 0, tests: 0 }
    });

    // Notify administrators
    createNotification(
      'registration',
      `New student enrollment: ${name} (${email})`,
      user.id,
      { email, name }
    );

    // Don't send passwordHash to client
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
