// user.service.js - Now uses API instead of IndexedDB
import { resetUserQuestionProgress } from './question.service';
import { clearAllUserTests } from './test.service';

const API_BASE = '/api/users';

export async function addUser(user) {
  // Registration is handled by /api/auth/register
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    return await res.json();
  } catch (error) {
    console.error('addUser error:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    const users = await getAllUsers();
    return users.find(u => u.email === email);
  } catch (error) {
    console.error('getUserByEmail error:', error);
    return null;
  }
}

export async function getUserById(id) {
  try {
    const res = await fetch(`${API_BASE}?id=${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('getUserById error:', error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  } catch (error) {
    console.error('getAllUsers error:', error);
    return [];
  }
}

export async function updateUser(user) {
  try {
    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('API Error details:', errorData);
      throw new Error(errorData.error || 'Failed to update user');
    }
    localStorage.setItem('medbank_users_updated', Date.now().toString());
    return await res.json();
  } catch (error) {
    console.error('updateUser error:', error);
    throw error;
  }
}

export async function deleteUser(id) {
  try {
    const res = await fetch(API_BASE, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return true;
  } catch (error) {
    console.error('deleteUser error:', error);
    throw error;
  }
}

export async function activateUserSubscription(id, requestedDays = 90) {
  const user = await getUserById(id);
  if (!user) throw new Error("User not found");
  
  const now = new Date();
  const isPaid = !!user.purchased || !!user.hasPendingPurchase;

  let days = requestedDays;
  if (!isPaid) {
    throw new Error("Subscription required. Please upgrade to access the QBank.");
  } else {
    // For paid users, always use the pendingDuration from the database record
    // This ensures we use the correct duration even if the client state is stale
    days = user.pendingDuration || requestedDays || 90;
  }

  // Fresh Start: Reset question progress and clear tests
  if (isPaid) {
    await resetUserQuestionProgress(id);
    await clearAllUserTests(id);
  }

  const durationMs = days * 24 * 60 * 60 * 1000;
  const expiry = new Date(now.getTime() + durationMs);

  const updatedUser = {
    ...user,
    subscriptionStatus: 'active',
    activatedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    activatedByPurchase: isPaid,
    purchased: isPaid,
    hasPendingPurchase: false,
    pendingDuration: 0, // Clear pending duration after activation
    subscriptionDuration: days, // Store the duration
    productName: user.productName || (isPaid ? 'Medical QBank' : 'ECG QBank'), // Preserve or set default
    trialUsed: user.trialUsed || !isPaid,
    updatedAt: now.toISOString()
  };
  
  await updateUser(updatedUser);
  return updatedUser;
}

export async function renewUserSubscription(id, extraDays = 90) {
  const user = await getUserById(id);
  if (!user) throw new Error("User not found");
  
  const now = new Date();
  let baseDate = now;

  if (user.subscriptionStatus === 'active' && user.activatedByPurchase && user.expiresAt) {
    const currentExpiry = new Date(user.expiresAt);
    if (currentExpiry > now) {
      baseDate = currentExpiry;
    }
  }

  const durationMs = extraDays * 24 * 60 * 60 * 1000;
  const expiry = new Date(baseDate.getTime() + durationMs);

  const updatedUser = {
    ...user,
    subscriptionStatus: 'active',
    purchased: true,
    activatedByPurchase: true,
    hasPendingPurchase: false,
    subscriptionDuration: (user.subscriptionDuration || 0) + extraDays, // Accumulate duration
    expiresAt: expiry.toISOString(),
    lastRenewedAt: now.toISOString()
  };
  
  await updateUser(updatedUser);
  return updatedUser;
}

export async function getStudentProgress(userId, productId) {
  try {
    const effectiveProductId = productId;
    if (!effectiveProductId) return { percentage: 0, completed: 0, total: 0, systems: {}, subjects: {} };

    const res = await fetch(`/api/questions/user?userId=${userId}&productId=${effectiveProductId}`);
    if (!res.ok) return { percentage: 0, completed: 0, total: 0, systems: {}, subjects: {} };

    const questions = await res.json();
    const total = questions.length;
    const completed = questions.filter(q => q.status === 'correct' || q.status === 'incorrect').length;
    const correctCount = questions.filter(q => q.status === 'correct').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const accuracy = completed > 0 ? Math.round((correctCount / completed) * 100) : 0;

    // Breakdown by system and subject
    const systems = {};
    const subjects = {};

    questions.forEach(q => {
      const sys = q.system || 'Other';
      const sub = q.subject || 'Other';

      if (!systems[sys]) systems[sys] = { total: 0, completed: 0, correct: 0 };
      if (!subjects[sub]) subjects[sub] = { total: 0, completed: 0, correct: 0 };

      systems[sys].total++;
      subjects[sub].total++;

      if (q.status === 'correct' || q.status === 'incorrect') {
        systems[sys].completed++;
        subjects[sub].completed++;
        if (q.status === 'correct') {
          systems[sys].correct++;
          subjects[sub].correct++;
        }
      }
    });

    return {
      percentage,
      completed,
      total,
      accuracy,
      correctCount,
      systems,
      subjects
    };
  } catch (error) {
    console.error('getStudentProgress error:', error);
    return { percentage: 0, completed: 0, total: 0, systems: {}, subjects: {} };
  }
}

export async function getUserSubscriptions(userId) {
  try {
    const res = await fetch(`/api/users/subscriptions?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return await res.json();
  } catch (error) {
    console.error('getUserSubscriptions error:', error);
    return [];
  }
}

export async function updateUserSubscription(id, status, days = 90, isPaid = false) {
  const user = await getUserById(id);
  if (!user) throw new Error("User not found");

  const now = new Date();
  const expiry = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

  const updatedUser = {
    ...user,
    subscriptionStatus: status,
    purchased: isPaid ? true : user.purchased,
    activatedByPurchase: isPaid ? true : user.activatedByPurchase,
    expiresAt: status === 'active' ? expiry.toISOString() : user.expiresAt,
    updatedAt: now.toISOString()
  };

  await updateUser(updatedUser);
  return updatedUser;
}

export async function banUser(id) {
  const user = await getUserById(id);
  if (!user) throw new Error("User not found");

  const updatedUser = {
    ...user,
    isBanned: true,
    subscriptionStatus: 'canceled',
    updatedAt: new Date().toISOString()
  };

  return await updateUser(updatedUser);
}

export async function updateUserQuestion(userId, questionId, productId, data) {
  try {
    const res = await fetch('/api/questions/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        questionId,
        productId,
        packageId: productId, // Fallback for API
        userAnswer: data.userAnswer,
        status: data.status,
        isMarked: data.isMarked,
        timeSpent: data.timeSpent,
        testId: data.testId // NEW: Forward testId for answer logging
      })
    });
    if (!res.ok) throw new Error('Failed to update question progress');
    return await res.json();
  } catch (err) {
    console.error('Update user question error:', err);
    throw err;
  }
}

export function getArchiveMetadata(user) {
  if (!user) return null;

  const isExpired = user.subscriptionStatus === 'expired' ||
    (user.expiresAt && new Date(user.expiresAt) <= new Date());

  if (isExpired) {
    const expiry = new Date(user.expiresAt);
    const now = new Date();
    const gracePeriodDays = 30;
    const deletionDate = new Date(expiry.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));
    const daysRemaining = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      type: 'expired',
      daysRemaining: Math.max(0, daysRemaining),
      deletionDate: deletionDate.toISOString(),
      isDeletable: daysRemaining <= 0
    };
  }

  return null;
}
