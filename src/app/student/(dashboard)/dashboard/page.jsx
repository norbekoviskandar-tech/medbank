"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllQuestions } from "@/services/question.service";
import { getAllTests } from "@/services/test.service";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";



export default function Dashboard() {
  const router = useRouter();
  const { selectedStudentProduct } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ accuracy: 0, usage: 0, completedTests: 0 });
  const [latestSuspended, setLatestSuspended] = useState(null);

  // Reactivity to context already handled by useContext + useEffect[selectedStudentProduct]

  useEffect(() => {
    const userId = localStorage.getItem("medbank_user");
    
    const fetchData = () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const pId = selectedStudentProduct?.id;

      Promise.all([
        import("@/services/user.service").then(m => m.getUserById(userId)),
        import("@/services/analytics.service").then(m => m.getUserProductStats(pId)),
        getAllTests(pId)
      ]).then(([userData, productStats, userHistory]) => {
        setUser(userData);
        setStats(productStats);
        
        const completedTests = userHistory.filter(t => !t.isSuspended);
        const suspendedTests = userHistory.filter(t => t.isSuspended);

        if (suspendedTests.length > 0) {
          const latest = [...suspendedTests].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          setLatestSuspended(latest);
        } else {
          setLatestSuspended(null);
        }

        setLoading(false);
      }).catch(err => {
        console.error("Dashboard load error:", err);
        setLoading(false);
      });
    };

    fetchData();

    // Listen for progress refresh events (e.g. after finishing a test)
    window.addEventListener("medbank_progress_refresh", fetchData);
    return () => window.removeEventListener("medbank_progress_refresh", fetchData);
  }, [selectedStudentProduct]);

  const handleResumeLatest = () => {
    if (!latestSuspended) return;

    const questions = latestSuspended.questions || [];
    const questionIds = questions.map(q => typeof q === 'string' ? q : q.id);

    localStorage.setItem("medbank_current_test", JSON.stringify({
      testId: latestSuspended.testId,
      testNumber: latestSuspended.testNumber,
      date: latestSuspended.date,
      questions: questionIds,
      mode: latestSuspended.mode,
      pool: latestSuspended.pool,
      resumeData: {
        originalTestId: latestSuspended.testId,
        answers: latestSuspended.answers || {},
        currentIndex: latestSuspended.currentIndex || 0,
        elapsedTime: latestSuspended.elapsedTime || 0,
        markedIds: latestSuspended.markedIds || [],
        isOmittedResume: false,
        isSuspended: true
      }
    }));

    router.push("/student/qbank/take-test");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d46af]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="bg-card p-6 md:p-12 border-b-2 border-primary shadow-sm rounded-2xl relative overflow-hidden transition-colors duration-300">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-light text-[#1e293b] dark:text-[#f8fafc]">
                Welcome, <span className="font-bold">{user?.name || "Student"}</span>
              </h1>
              <p className="text-[#64748b] dark:text-[#94a3b8] mt-4 text-lg">
                Ready to continue your medical journey?
              </p>
            </div>

            {latestSuspended && (
              <button
                onClick={handleResumeLatest}
                className="group flex items-center gap-3 bg-[#1d46af] hover:bg-[#16368a] text-white px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Resume Progress</span>
                  <span className="text-sm font-bold">Test #{latestSuspended.testNumber}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </div>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b] dark:text-[#94a3b8] mb-2">Overall Accuracy</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#1d46af] dark:text-[#3b82f6]">{stats.accuracy}%</span>
                <div className="h-1.5 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-[#1d46af]" style={{ width: `${stats.accuracy}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b] dark:text-[#94a3b8] mb-2">QBank Usage</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#10b981]">{stats.usage}%</span>
                <div className="h-1.5 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-[#10b981]" style={{ width: `${stats.usage}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b] dark:text-[#94a3b8] mb-2">Tests Completed</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#fbbf24]">{stats.completedTests}</span>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-300 uppercase">Sessions</span>
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
