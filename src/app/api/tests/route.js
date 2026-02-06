import { NextResponse } from 'next/server';
import { getUserTests, saveTest, deleteTest, clearUserTests, getEligiblePool, getUniverseSize, getQuestionById } from '@/lib/server-db';

// GET /api/tests?userId=xxx - Get all tests for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const packageId = searchParams.get('packageId');
    
    if (!userId || !packageId) {
      return NextResponse.json({ error: 'userId and packageId required' }, { status: 400 });
    }
    
    const tests = getUserTests(userId, packageId);
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Get tests error:', {
      message: error.message,
      stack: error.stack,
      userId: new URL(request.url).searchParams.get('userId'),
      packageId: new URL(request.url).searchParams.get('packageId')
    });
    return NextResponse.json({ error: 'Failed to get tests: ' + error.message }, { status: 500 });
  }
}

// POST /api/tests - Assemble and Save a test
export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.userId || !data.packageId) {
      return NextResponse.json({ error: 'userId and packageId required' }, { status: 400 });
    }

    // 1. Check if we need to ASSEMBLE the test on the server (Preferred)
    let questions = data.questions;
    let universeSize = data.universeSize;
    let eligiblePoolSize = data.eligiblePoolSize;

    if (!questions && data.poolLogic && data.count) {
      // ASSEMBLY ENGINE TRIGGERED
      console.log('Test Assembly Engine: Creating new block...', data.poolLogic);
      
      universeSize = getUniverseSize(data.packageId);
      const eligibleIds = getEligiblePool(data.userId, data.packageId, data.poolLogic, data.count);
      eligiblePoolSize = eligibleIds.length;
      
      if (eligiblePoolSize === 0) {
        return NextResponse.json({ error: 'No questions matching these filters are available in your universe.' }, { status: 400 });
      }

      // Snapshot the IDs into the question list
      // For now, we store the full question objects in the 'questions' JSON blob to ensure immutability
      // even if the question is deleted or changed in the main library (snapshotting).
      questions = eligibleIds.map(id => getQuestionById(id));
      
      // Adjust count if universe was smaller than requested
      if (questions.length < data.count) {
        console.warn(`Requested ${data.count} but only found ${questions.length}`);
      }
    }

    if (!questions || !data.testId) {
      return NextResponse.json({ error: 'testId and question list (or assembly logic) required' }, { status: 400 });
    }

    const testToSave = {
      ...data,
      questions,
      universeSize,
      eligiblePoolSize,
      poolLogic: data.poolLogic || {},
      createdAt: new Date().toISOString()
    };
    
    const saved = saveTest(testToSave);

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Save test error:', error);
    return NextResponse.json({ error: 'Failed to create test: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/tests - Delete a test or clear all user tests
export async function DELETE(request) {
  try {
    const { testId, userId, clearAll } = await request.json();
    
    if (clearAll && userId) {
      clearUserTests(userId);
    } else if (testId) {
      deleteTest(testId);
    } else {
      return NextResponse.json({ error: 'testId or userId+clearAll required' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete test error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
