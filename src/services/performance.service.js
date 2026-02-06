// performance.service.js - Real product-scoped analytics

/**
 * Fetch product-scoped performance statistics.
 * @param {string} packageId - Required product ID
 * @returns {Promise<Object>} Performance stats for the specified product
 */
export async function getPerformanceStats(packageId) {
  if (!packageId) {
    console.warn('getPerformanceStats called without packageId');
    return { 
      error: 'No product selected',
      revenue: { total: 0, thisMonth: 0, trend: '0%' },
      students: { total: 0, active: 0, growth: '0%' },
      charts: { revenueHistory: [], enrollments: [] }
    };
  }

  try {
    const res = await fetch(`/api/analytics?type=dashboard&packageId=${packageId}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch analytics');
    }
    return await res.json();
  } catch (error) {
    console.error('getPerformanceStats error:', error);
    return { 
      revenue: { total: 0, thisMonth: 0, trend: '0%' },
      students: { total: 0, active: 0, growth: '0%' },
      charts: { revenueHistory: [], enrollments: [] }
    };
  }
}

/**
 * Fetch product-scoped engagement data.
 * @param {string} packageId - Required product ID
 */
export async function getEngagementStats(packageId) {
  if (!packageId) {
    return { error: 'No product selected', data: [] };
  }

  try {
    const res = await fetch(`/api/analytics?type=engagement&packageId=${packageId}`);
    if (!res.ok) throw new Error('Failed to fetch engagement data');
    return await res.json();
  } catch (error) {
    console.error('getEngagementStats error:', error);
    return { data: [] };
  }
}

/**
 * Fetch student cognition profile for a specific product.
 * @param {string} userId - User ID
 * @param {string} packageId - Required product ID
 */
export async function getCognitionProfile(userId, packageId) {
  if (!userId || !packageId) {
    return { readinessScore: 0, overthinkingIndex: 0, impulsivityIndex: 0, fatigueFactor: 0 };
  }

  try {
    const res = await fetch(`/api/analytics?type=cognition&userId=${userId}&packageId=${packageId}`);
    if (!res.ok) throw new Error('Failed to fetch cognition profile');
    return await res.json();
  } catch (error) {
    console.error('getCognitionProfile error:', error);
    return { readinessScore: 0, overthinkingIndex: 0, impulsivityIndex: 0, fatigueFactor: 0 };
  }
}
