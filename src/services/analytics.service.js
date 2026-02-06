// analytics.service.js - Now uses API instead of IndexedDB

const API_BASE = '/api/analytics';

export async function getDashboardStats(packageId = null) {
    try {
        let url = API_BASE;
        if (packageId) url += `?packageId=${packageId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return await res.json();
    } catch (error) {
        console.error('getDashboardStats error:', error);
    return {
        totalUsers: 0,
        paidUsers: 0,
        dau: 0,
        retention: "0%",
        conversion: "0%",
        avgSession: "0m 0s",
        totalQuestions: 0,
        totalTests: 0
    };
    }
}

export async function getEngagementChartData(packageId = null) {
    try {
        let url = `${API_BASE}?type=engagement`;
        if (packageId) url += `&packageId=${packageId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch engagement data');
        return await res.json();
    } catch (error) {
        console.error('getEngagementChartData error:', error);
        return [];
    }
}

export async function getStudentCognition(packageId) {
    const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;
    if (!userId || !packageId) return null;

    try {
        const res = await fetch(`${API_BASE}?type=cognition&userId=${userId}&packageId=${packageId}`);
        if (!res.ok) throw new Error('Failed to fetch cognition');
        return await res.json();
    } catch (error) {
        console.error('getStudentCognition error:', error);
        return null;
    }
}

export async function getUserProductStats(packageId) {
    const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;
    if (!userId || !packageId) return { accuracy: 0, usage: 0, completedTests: 0 };

    try {
        const res = await fetch(`/api/student/stats?userId=${userId}&packageId=${packageId}`);
        if (!res.ok) throw new Error('Failed to fetch student stats');
        return await res.json();
    } catch (error) {
        console.error('getUserProductStats error:', error);
        return { accuracy: 0, usage: 0, completedTests: 0 };
    }
}

// These are still return mock/empty data for now as we transition
export async function getRetentionData() {
    return [];
}

export async function getEngagementStats() {
    return {
        distribution: [],
        topEvents: [],
        recentActivities: []
    };
}

export async function getFunnelMetrics() {
    return [];
}
