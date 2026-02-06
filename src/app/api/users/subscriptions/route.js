import { NextResponse } from 'next/server';
import { getUserSubscriptions, createUserSubscription, activateSubscription, getActiveSubscriptionByUserAndProduct, extendSubscription } from '@/lib/server-db';

// GET /api/users/subscriptions?userId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const subscriptions = getUserSubscriptions(userId);
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST /api/users/subscriptions
export async function POST(request) {
  try {
    const { userId, productId, durationDays, productName, amount, paymentToken } = await request.json();

    if (!userId || !productId || !durationDays) {
      return NextResponse.json({ error: 'userId, productId, and durationDays are required' }, { status: 400 });
    }

    console.log(`[API] Creating/extending subscription for user ${userId}, product ${productId}, amount ${amount}`);

    // Check for existing active subscription
    const existingSubscription = getActiveSubscriptionByUserAndProduct(userId, productId);
    
    if (existingSubscription) {
      console.log(`[API] Found existing active subscription ${existingSubscription.id}, extending duration by ${durationDays} days`);
      
      // Extend existing subscription
      const extendedSub = extendSubscription(existingSubscription.id, durationDays);
      
      return NextResponse.json({
        ...extendedSub,
        message: 'Subscription extended successfully',
        action: 'extended'
      });
    }

    // No existing subscription, create new one
    console.log(`[API] No existing subscription found, creating new subscription`);
    
    const activeSub = createUserSubscription({
      userId,
      packageId: productId,
      durationDays: Number(durationDays),
      productName: productName || 'Medical QBank',
      amount: amount || 0,
      status: 'active'
    });

    // Return full subscription object (including purchaseDate) on success
    return NextResponse.json({
      ...activeSub,
      message: 'Subscription created successfully',
      action: 'created'
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ 
      error: 'Failed to create subscription',
      message: error.message 
    }, { status: 500 });
  }
}
