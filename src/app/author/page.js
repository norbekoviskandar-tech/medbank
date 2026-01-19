"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, TrendingUp, Target, Shield } from 'lucide-react';

// Import components
import KPICard from '@/components/author/KPICard';
import QuickInsights from '@/components/author/QuickInsights';
import DashboardCharts from '@/components/author/DashboardCharts';
import BottomStats from '@/components/author/BottomStats';

// Import analytics
import { getDashboardStats, getEngagementChartData, getEngagementStats } from '@/services/analytics.service';
import { getAllUsers } from '@/services/user.service';
import { getAllQuestions } from '@/services/question.service';

const PASS = "medbank-dev-2026";

const dummyChartData = [
  { name: '1', val: 400 },
  { name: '2', val: 300 },
  { name: '3', val: 500 },
  { name: '4', val: 450 },
  { name: '5', val: 600 },
  { name: '6', val: 700 },
  { name: '7', val: 850 },
];

const decliningData = [
  { name: '1', val: 850 },
  { name: '2', val: 700 },
  { name: '3', val: 750 },
  { name: '4', val: 600 },
  { name: '5', val: 500 },
  { name: '6', val: 450 },
  { name: '7', val: 400 },
];

export default function Dashboard() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalUsers: "24.5K",
    paidUsers: "8.2K",
    dau: "17.8K",
    avgSession: "8m 32s",
    retention: "68.4%",
    conversion: "3.2%",
    userTrend: [22100, 22800, 23400, 23900, 24100, 24300, 24500],
    dauTrend: [15200, 16100, 14800, 17200, 18300, 16900, 17800],
    sessionTrend: [7.2, 7.8, 7.1, 8.1, 8.9, 8.2, 8.5],
    retentionTrend: [72, 70, 69, 68, 67, 69, 68.4],
    conversionTrend: [2.1, 2.4, 2.8, 2.9, 3.1, 3.0, 3.2],
    engagementData: dummyChartData,
    sessionData: [],
    topEvents: [],
    recentActivities: [],
    lastUpdated: new Date()
  });

  const [isLoading, setIsLoading] = useState(true);

  // Visibility & Focus handling
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isUnlocked) {
        console.log("[Dashboard] Tab visible, refreshing data...");
        loadRealData();
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    return () => window.removeEventListener("visibilitychange", handleVisibility);
  }, [isUnlocked]);

  // Auto-refresh logic (5 mins)
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, lastUpdated: new Date() }));
      console.log("[Dashboard] Auto-refreshing metrics...");
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unlocked = localStorage.getItem("medbank-author-unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
      loadRealData();
    }
  }, []);
  const loadRealData = async () => {
    setIsLoading(true);
    try {
      const dashboardStats = await getDashboardStats();
      const engagement = await getEngagementChartData();
      const engagementStats = await getEngagementStats();
      const users = await getAllUsers();

      setStats({
        totalUsers: users.length.toLocaleString(),
        paidUsers: dashboardStats.paidUsers.toLocaleString(),
        dau: dashboardStats.dau.toLocaleString(),
        retention: dashboardStats.retention + "%",
        conversion: dashboardStats.conversion + "%",
        avgSession: dashboardStats.avgSession,
        userTrend: [22100, 22800, 23400, 23900, 24100, 24300, 24500],
        dauTrend: [15200, 16100, 14800, 17200, 18300, 16900, 17800],
        sessionTrend: [7.2, 7.8, 7.1, 8.1, 8.9, 8.2, 8.5],
        retentionTrend: [72, 70, 69, 68, 67, 69, 68.4],
        conversionTrend: [2.1, 2.4, 2.8, 2.9, 3.1, 3.0, 3.2],
        engagementData: engagement,
        sessionData: engagementStats.distribution,
        topEvents: engagementStats.topEvents,
        recentActivities: engagementStats.recentActivities,
        questionsCount: dashboardStats.totalQuestions,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pass === PASS) {
      localStorage.setItem("medbank-author-unlocked", "true");
      setIsUnlocked(true);
      loadRealData();
    } else {
      setError("Access Denied: Invalid Authorization Token");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="cyber-theme flex min-h-screen items-center justify-center p-6 cyber-mesh">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="cyber-card p-8 w-full max-w-md flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center pulse-glow">
            <Shield className="text-[#8B5CF6]" size={32} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Secure Terminal</h2>
            <p className="text-gray-400 text-sm">Enter authorization code to access Analytics Pro</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#8B5CF6]/50 focus:outline-none transition-all font-mono"
              />
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-[10px] font-mono uppercase tracking-widest text-center">{error}</motion.p>}
            </div>
            <button
              type="submit"
              className="w-full bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all active:scale-95"
            >
              AUTHENTICATE
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (isLoading || !stats.engagementData.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin"></div>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Syncing_Realtime_Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-8"
        >
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <KPICard
              title="System Users"
              value={stats.totalUsers}
              secondaryValue={stats.paidUsers}
              trend="+14.2%"
              icon={Users}
              color="text-[#06B6D4]"
              trendData={stats.userTrend}
              insight="Strong growth in premium tier"
              benchmark="Benchmark: 30% conversion"
            />
            <KPICard
              title="Daily Active Users"
              value={stats.dau}
              trend="+12.5%"
              icon={Users}
              color="text-[#8B5CF6]"
              trendData={stats.dauTrend}
              insight="Peak performance on weekends"
              benchmark="Above industry avg"
            />
            <KPICard
              title="Avg Session Duration"
              value={stats.avgSession}
              trend="+8.3%"
              icon={Clock}
              color="text-[#06B6D4]"
              trendData={stats.sessionTrend}
              insight="Users highly engaged"
              benchmark="Excellent retention"
            />
            <KPICard
              title="Retention Rate"
              value={stats.retention}
              trend="-2.1%"
              icon={TrendingUp} // This is Repeat icon normally, using TrendingUp for consistency
              color="text-[#10B981]"
              trendData={stats.retentionTrend}
              insight="Seasonal dip expected"
              benchmark="Strong fundamentals"
            />
            <KPICard
              title="Conversion Rate"
              value={stats.conversion}
              trend="+15.7%"
              icon={Target}
              color="text-[#F59E0B]"
              trendData={stats.conversionTrend}
              insight="New feature impact"
              benchmark="Trending upward"
            />
          </div>

          {/* Insights Bar */}
          <QuickInsights />

          {/* Main Charts */}
        <DashboardCharts engagementData={stats.engagementData} sessionData={stats.sessionData} />

        {/* Bottom Stats */}
        <BottomStats topEvents={stats.topEvents} recentActivities={stats.recentActivities} />
        </motion.div>
      </main>
    </div >
  );
}
