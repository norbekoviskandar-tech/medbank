import { NextResponse } from 'next/server';
import { getAllUsers, getUserById, updateUser, deleteUser, createNotification } from '@/lib/server-db';

// GET /api/users - Get all users or single user by id
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const user = getUserById(id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const { passwordHash: _, ...safeUser } = user;
      return NextResponse.json(safeUser);
    }
    
    const users = getAllUsers().map(({ passwordHash: _, ...user }) => user);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

// PUT /api/users - Update a user
export async function PUT(request) {
  try {
    const updates = await request.json();
    console.log('API: Processing user update for ID:', updates.id);
    
    if (!updates.id) {
      console.error('API: Update failed - missing user ID');
      return NextResponse.json({ error: 'User id required' }, { status: 400 });
    }
    
    // Fetch existing user to preserve fields not sent by client (like passwordHash)
    const existingUser = getUserById(updates.id);
    if (!existingUser) {
      console.error('API: Update failed - user not found in DB:', updates.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge updates into existing user
    const updatedUser = {
      ...existingUser,
      ...updates,
      // Ensure we don't accidentally unset stats if not provided
      stats: updates.stats || existingUser.stats
    };

    // Detect purchase activation
    if (updates.activatedByPurchase && !existingUser.activatedByPurchase) {
        createNotification(
            'purchase',
            `Subscription activated: ${existingUser.name} (${existingUser.email})`,
            existingUser.id,
            { email: existingUser.email, name: existingUser.name, type: 'paid' }
        );
    }
    
    try {
      const saved = updateUser(updatedUser);
      console.log('API: User updated successfully in DB');
      const { passwordHash: _, ...safeUser } = saved;
      return NextResponse.json(safeUser);
    } catch (dbError) {
      console.error('API: Database update error:', dbError);
      return NextResponse.json({ error: 'Database update failed', details: dbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error('API: Unexpected update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users - Delete a user
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'User id required' }, { status: 400 });
    }
    
    try {
      const result = deleteUser(id);
      return NextResponse.json({ success: true, message: 'User permanently deleted' });
    } catch (dbError) {
      console.error('Delete user DB error:', dbError);
      return NextResponse.json({ error: dbError.message || 'Failed to delete user from database' }, { status: 500 });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
