"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, PieChart as PieChartIcon, Clock, 
  Target, GraduationCap, ArrowLeft, RefreshCcw, 
  BookOpen, ChevronRight, CheckCircle2, XCircle, 
  MinusCircle, TrendingUp, Search, Eye
} from "lucide-react";

export default function TestSummaryPage() {
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // all, incorrect, marked, omitted
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("medbank_user");
    const historyKey = `medbank_test_history_${userId}`;
    const lastTestId = localStorage.getItem("medbank_last_test_id");
    const testHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
    const result = testHistory.find(t => t.testId.toString() === lastTestId) || testHistory[testHistory.length - 1];
    
    if (!result) {
      router.push("/app/qbank/create-test");
      return;
    }
    setTestResult(result);
  }, [router]);

  const stats = useMemo(() => {
    if (!testResult) return null;
    const total = testResult.questions.length;
    const correctItems = testResult.questions.filter(q => q.userAnswer === q.correct);
    const incorrectItems = testResult.questions.filter(q => q.userAnswer && q.userAnswer !== q.correct);
    const omittedItems = testResult.questions.filter(q => !q.userAnswer);
    const markedItems = testResult.questions.filter(q => (testResult.markedIds || []).includes(q.id));
    
    const percentage = Math.round((correctItems.length / total) * 100);

    const subjectStats = {};
    testResult.questions.forEach(q => {
      if (!subjectStats[q.subject]) subjectStats[q.subject] = { total: 0, correct: 0 };
      subjectStats[q.subject].total++;
      if (q.userAnswer === q.correct) subjectStats[q.subject].correct++;
    });

    return { 
      total, 
      correct: correctItems.length, 
      incorrect: incorrectItems.length, 
      omitted: omittedItems.length, 
      marked: markedItems.length,
      percentage, 
      subjectStats,
      lists: {
        all: testResult.questions,
        incorrect: incorrectItems,
        marked: markedItems,
        omitted: omittedItems
      }
    };
  }, [testResult]);

  const handleReview = (filter = "all") => {
    const filterIds = stats.lists[filter].map(q => q.id);
    if (filterIds.length === 0) return;

    localStorage.setItem("medbank_current_test", JSON.stringify({
      ...testResult,
      questions: filterIds, // Only review the filtered set
      isReview: true,
      reviewFilter: filter
    }));
    router.push("/app/qbank/take-test");
  };

  if (!testResult || !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <RefreshCcw className="animate-spin text-[#002b5c]" size={32} />
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans pb-20">
      {/* UWorld Style Header */}
      <div className="bg-[#002b5c] text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/app/qbank")} className="hover:bg-white/10 p-1.5 rounded-lg transition-all">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-[15px] font-bold uppercase tracking-wider">Test Analysis Report</h1>
          </div>
          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-blue-200/70">
            <span>Date: {new Date(testResult.date).toLocaleDateString()}</span>
            <span>Mode: {testResult.mode}</span>
            <span>Test ID: {testResult.testId}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        
        {/* TOP ROW: Overall Performance & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="p-8 border-r border-zinc-100 flex flex-col items-center justify-center md:w-64 bg-zinc-50/30">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="64" cy="64" r="58" stroke="#0072bc" strokeWidth="8" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={2 * Math.PI * 58 * (1 - stats.percentage / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-3xl font-black text-[#002b5c]">{stats.percentage}%</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Score</span>
            </div>

            <div className="flex-1 p-8 grid grid-cols-2 md:grid-cols-4 gap-6 content-center">
               {[
                 { label: 'Correct', value: stats.correct, color: 'text-green-600', sub: 'Answered Right', icon: CheckCircle2 },
                 { label: 'Incorrect', value: stats.incorrect, color: 'text-red-500', sub: 'Answered Wrong', icon: XCircle },
                 { label: 'Omitted', value: stats.omitted, color: 'text-blue-400', sub: 'Skipped Items', icon: MinusCircle },
                 { label: 'Marked', value: stats.marked, color: 'text-orange-400', sub: 'Flagged for Review', icon: GraduationCap }
               ].map((item, i) => (
                 <div key={i} className="space-y-1">
                   <div className={`flex items-center gap-1.5 ${item.color}`}>
                     <item.icon size={14} />
                     <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                   </div>
                   <div className="text-2xl font-black text-zinc-800">{item.value}</div>
                   <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-tight">{item.sub}</div>
                 </div>
               ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#002b5c] rounded-xl p-8 text-white shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Next Steps</h3>
              <p className="text-sm font-medium text-blue-100 leading-relaxed mb-6">Review your mistakes to turn weaknesses into strengths. UWorld recommends a 3:1 review-to-test ratio.</p>
            </div>
            <button 
              onClick={() => handleReview("all")}
              className="w-full bg-[#0072bc] hover:bg-[#005a96] text-white py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] transition-all active:scale-[0.98] shadow-lg shadow-blue-900/40"
            >
              Start Comprehensive Review
            </button>
          </div>

        </div>

        {/* BOTTOM ROW: Detailed Breakdown & Results Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List of Questions (The "Review" Table in UWorld) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="flex gap-4">
                {['All', 'Incorrect', 'Marked', 'Omitted'].map(tab => {
                  const count = stats[tab.toLowerCase()] ?? stats.total;
                  const isDisabled = count === 0;
                  const isActive = activeTab === tab.toLowerCase();
                  return (
                    <button 
                      key={tab}
                      onClick={() => !isDisabled && setActiveTab(tab.toLowerCase())}
                      disabled={isDisabled}
                      className={`text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${
                        isDisabled ? 'text-zinc-300 cursor-not-allowed' :
                        isActive ? 'bg-[#002b5c] text-white' : 
                        'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="text" placeholder="Search ID..." className="pl-9 pr-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 w-40" />
              </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
                     <th className="px-6 py-4">Item #</th>
                     <th className="px-6 py-4">Q-ID</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Subject</th>
                     <th className="px-6 py-4 text-right">Review</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-50">
                   {stats.lists[activeTab].map((q, idx) => {
                     const isCorrect = q.userAnswer === q.correct;
                     const isOmitted = !q.userAnswer;
                     return (
                       <tr key={q.id} className="hover:bg-zinc-50/80 transition-colors group">
                         <td className="px-6 py-4 text-[13px] font-bold text-zinc-500">{idx + 1}</td>
                         <td className="px-6 py-4 text-[13px] font-black text-[#002b5c]">{q.id}</td>
                         <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isOmitted ? 'bg-blue-50 text-blue-500' : (isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500')}`}>
                               {isOmitted ? 'Omitted' : (isCorrect ? 'Correct' : 'Incorrect')}
                            </div>
                         </td>
                         <td className="px-6 py-4 text-[12px] font-medium text-zinc-600">{q.subject}</td>
                         <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                localStorage.setItem("medbank_current_test", JSON.stringify({ ...testResult, questions: [q.id], isReview: true }));
                                router.push("/app/qbank/take-test");
                              }}
                              className="p-2 text-zinc-300 group-hover:text-blue-500 transition-all"
                            >
                               <Eye size={16} />
                            </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
          </div>

          {/* Subject Stats Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
              <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-[#002b5c] mb-6 flex items-center gap-2">
                <GraduationCap size={16} className="text-purple-500" />
                Category Performance
              </h3>
              <div className="space-y-5">
                {Object.entries(stats.subjectStats).map(([subj, data]) => {
                  const perc = Math.round((data.correct/data.total)*100);
                  return (
                    <div key={subj}>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[12px] font-bold text-zinc-700">{subj}</span>
                        <span className="text-[10px] font-black text-zinc-900">{perc}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div className={`h-full ${perc >= 70 ? 'bg-green-500' : perc >= 50 ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
              <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-[#002b5c] mb-6 flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                Pacing Report
              </h3>
              <div className="flex flex-col items-center justify-center py-4 bg-zinc-50 rounded-xl">
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Avg Time / Question</span>
                 <p className="text-4xl font-black text-[#002b5c] tracking-tighter">{Math.round(testResult.elapsedTime / stats.total)}<span className="text-sm font-bold text-zinc-400 ml-1">sec</span></p>
                 <div className="mt-4 px-4 py-1.5 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-full">Optimal Pace</div>
              </div>
            </section>
          </div>

        </div>

      </div>
    </div>
  );
}
