"use client";

import { useEffect, useState } from "react";
import { getAllQuestions } from "@/services/question.service";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    accuracy: 0,
    usage: 0,
    completedTests: 0
  });

  useEffect(() => {
    const userId = localStorage.getItem("medbank_user");
    if (userId) {
      const statsKey = `medbank_qbank_stats_${userId}`;
      const historyKey = `medbank_test_history_${userId}`;

      Promise.all([
        import("@/services/user.service").then(m => m.getUserById(userId)),
        getAllQuestions(),
        Promise.resolve(JSON.parse(localStorage.getItem(statsKey) || "{}")),
        Promise.resolve(JSON.parse(localStorage.getItem(historyKey) || "[]"))
      ]).then(([userData, allQuestions, userStats, userHistory]) => {
        setUser(userData);
        
        const publishedCount = allQuestions.filter(q => q.published).length;
        const usedCount = Object.keys(userStats).length;
        const usagePerc = publishedCount > 0 ? Math.round((usedCount / publishedCount) * 100) : 0;

        const completedTests = userHistory.filter(t => !t.isSuspended);
        const avgScore = completedTests.length > 0 
          ? Math.round(completedTests.reduce((acc, t) => {
              const correct = t.questions.filter(q => q.userAnswer === q.correct).length;
              return acc + (correct / t.questions.length);
            }, 0) / completedTests.length * 100)
          : 0;

        setStats({
          accuracy: avgScore,
          usage: usagePerc,
          completedTests: completedTests.length
        });
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d46af]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-6 md:p-12 border-b-2 border-[#1d46af] shadow-sm rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-light text-[#1e293b]">
            Welcome, <span className="font-bold">{user?.name || "Student"}</span>
          </h1>
          <p className="text-[#64748b] mt-4 text-lg">
            Ready to continue your medical journey?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-zinc-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b] mb-2">Overall Accuracy</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#1d46af]">{stats.accuracy}%</span>
                <div className="h-1.5 w-24 bg-zinc-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#1d46af]" style={{ width: `${stats.accuracy}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b] mb-2">QBank Usage</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#10b981]">{stats.usage}%</span>
                <div className="h-1.5 w-24 bg-zinc-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#10b981]" style={{ width: `${stats.usage}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b] mb-2">Tests Completed</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#fbbf24]">{stats.completedTests}</span>
                <span className="text-xs font-bold text-zinc-400 uppercase">Sessions</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1d46af]/5 -mr-32 -mt-32 rounded-full" />
      </div>

      <div className="px-4">
        <p className="text-[#94a3b8] text-sm font-medium italic">
          Tip: Consistent daily practice of at least 10 questions significantly improves board exam scores.
        </p>
      </div>
    </div>
  );
}
