import { NextResponse } from 'next/server';
import { createUserSubscription, activateSubscription, getActiveSubscriptionByUserAndProduct, extendSubscription } from '@/lib/db/users.repo';

// POST /api/subscriptions/purchase
// Body: { userId: 'xxx', cart: [{ id: packageId, title: 'Name', duration: 90, ... }] }
export async function POST(request) {
  try {
    const { userId, cart } = await request.json();

    if (!userId || !cart || !Array.isArray(cart)) {
      return NextResponse.json({ error: 'userId and cart are required' }, { status: 400 });
    }

    const results = [];

    for (const item of cart) {
      const packageId = item.id;
      const durationDays = item.duration || 90;
      const productName = item.title || 'Medical QBank';

      console.log(`[Purchase API] Processing item: packageId=${packageId}, duration=${durationDays}`);

      // Check for existing active subscription
      const existingSubscription = getActiveSubscriptionByUserAndProduct(userId, packageId);
      
      if (existingSubscription) {
        console.log(`[Purchase API] Found existing active subscription ${existingSubscription.id}, extending`);
        
        // Extend existing subscription
        const extendedSub = extendSubscription(existingSubscription.id, durationDays);
        results.push({
          ...extendedSub,
          action: 'extended',
          message: 'Subscription extended successfully'
        });
      } else {
        console.log(`[Purchase API] No existing subscription, creating new one`);
        
        // Create new subscription
        const sub = createUserSubscription({
          userId,
          packageId,
          durationDays,
          productName
        });

        // In this sandbox environment, we activate it immediately
        const activeSub = activateSubscription(sub.id);
        results.push({
          ...activeSub,
          action: 'created',
          message: 'Subscription created successfully'
        });
      }
    }

    return NextResponse.json({ success: true, subscriptions: results });
  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
}
