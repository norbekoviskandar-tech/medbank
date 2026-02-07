// test.service.js - Now uses API instead of IndexedDB

const API_BASE = '/api/tests';

export async function saveTest(test) {
  const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;
  
  if (!test || !test.testId) {
    console.error("Attempted to save test without testId:", test);
    throw new Error("Cannot save test: missing testId");
  }
  
  if (!test.userId && userId) {
    test.userId = userId;
  }
  
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save test');
    }
    return await res.json();
  } catch (error) {
    console.error('saveTest error:', error);
    throw error;
  }
}

/**
 * NEW: Calculate pool sizing before test creation
 */
export async function getPoolSizing(packageId, filters) {
  const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;
  if (!userId) return { universeSize: 0, eligiblePoolSize: 0 };

  try {
    const res = await fetch('/api/tests/pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, packageId, filters })
    });
    if (!res.ok) throw new Error('Failed to calculate pool');
    return await res.json();
  } catch (err) {
    console.error('getPoolSizing error:', err);
    return { universeSize: 0, eligiblePoolSize: 0 };
  }
}

/**
 * NEW: Request an assembled test from the server logic
 */
export async function assembleTest(packageId, poolLogic, count, mode = 'tutor') {
  const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;
  if (!userId) throw new Error("No user logged in");

  const testId = crypto.randomUUID();
  const testData = {
    testId,
    userId,
    packageId,
    poolLogic,
    count,
    mode,
    questions: null, // Instructs server to assemble
    date: new Date().toLocaleDateString(),
  };

  return await saveTest(testData);
}

export async function getAllTests(packageId = null) {
  const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;
  
  if (!userId) {
    console.warn('No user logged in, returning empty tests');
    return [];
  }

  let effectivePackageId = packageId;
  if (effectivePackageId === null && typeof window !== 'undefined') {
    const stored = localStorage.getItem("medbank_focused_product");
    if (stored) {
      try {
        const focused = JSON.parse(stored);
        effectivePackageId = focused?.id || null;
      } catch (e) {
        effectivePackageId = null;
      }
    }
  }
  
  try {
    let url = `${API_BASE}?userId=${userId}`;
    if (effectivePackageId) {
      url += `&packageId=${effectivePackageId}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch tests');
    }
    return await res.json();
  } catch (error) {
    console.error('getAllTests error:', error);
    return [];
  }
}

export async function getTestById(id, productId) {
  try {
    const query = productId ? `?packageId=${productId}` : '';
    const res = await fetch(`${API_BASE}/${id}${query}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch test');
    }
    return await res.json();
  } catch (error) {
    console.error('getTestById error:', error);
    return null;
  }
}

export async function deleteTest(id) {
  try {
    const res = await fetch(API_BASE, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: id })
    });
    if (!res.ok) throw new Error('Failed to delete test');
    return true;
  } catch (error) {
    console.error('deleteTest error:', error);
    throw error;
  }
}

export async function clearAllUserTests(userId) {
  try {
    const res = await fetch(API_BASE, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clearAll: true })
    });
    if (!res.ok) throw new Error('Failed to clear tests');
    return true;
  } catch (error) {
    console.error('clearAllUserTests error:', error);
    throw error;
  }
}

/**
 * ATTEMPT SCOPED ATOMIC UPDATES
 */

export async function updateAttemptAnswer(attemptId, questionId, selectedOption) {
  try {
    const res = await fetch(`/api/tests/attempts/${attemptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'answer',
        questionId,
        selectedOption
      })
    });
    return res.ok;
  } catch (err) {
    console.error('updateAttemptAnswer error:', err);
    return false;
  }
}

export async function updateAttemptFlag(attemptId, questionId, isFlagged) {
  try {
    const res = await fetch(`/api/tests/attempts/${attemptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'flag',
        questionId,
        isFlagged
      })
    });
    return res.ok;
  } catch (err) {
    console.error('updateAttemptFlag error:', err);
    return false;
  }
}

export async function snapshotAttempt(attemptId, snapshot) {
  try {
    const res = await fetch(`/api/tests/attempts/${attemptId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'snapshot',
        snapshot
      })
    });
    return res.ok;
  } catch (err) {
    console.error('snapshotAttempt error:', err);
    return false;
  }
}

export async function finishAttempt(attemptId, snapshot) {
  try {
    const res = await fetch(`/api/tests/attempts/${attemptId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'finish',
        snapshot
      })
    });
    return res.ok;
  } catch (err) {
    console.error('finishAttempt error:', err);
    return false;
  }
}
