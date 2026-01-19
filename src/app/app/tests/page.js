"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  History, Play, Calendar, 
  BarChart, Clock, ChevronRight, 
  Trash2, CheckCircle2,
  MoreVertical, FileText, LayoutList,
  Search, Filter, ArrowUpDown, Eye,
  RotateCcw
} from "lucide-react";

export default function PreviousTestsPage() {
  const [tests, setTests] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, completed, suspended
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("medbank_user");
    if (!userId) return;

    const historyKey = `medbank_test_history_${userId}`;
    let history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    
    // Migration: Assign test numbers to old records accurately
    let needsUpdate = false;
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    history = history.map((test, index) => {
      if (!test.testNumber) {
        needsUpdate = true;
        return { ...test, testNumber: index + 1 };
      }
      return test;
    });

    if (needsUpdate) {
      localStorage.setItem(historyKey, JSON.stringify(history));
    }

    setTests(history.sort((a, b) => (a.testNumber || 0) - (b.testNumber || 0)));
  }, []);

  const handleResume = (test, onlyOmitted = false) => {
    let questionIds = test.questions.map(q => typeof q === 'string' ? q : q.id);
    
    if (onlyOmitted) {
      // Find IDs that have no userAnswer in the test results
      questionIds = test.questions.filter(q => !q.userAnswer).map(q => q.id);
    }

    localStorage.setItem("medbank_current_test", JSON.stringify({
      questions: questionIds,
      mode: test.mode,
      resumeData: {
        answers: onlyOmitted ? {} : (test.answers || {}),
        currentIndex: 0,
        elapsedTime: test.elapsedTime || 0,
        isOmittedOnly: onlyOmitted,
        originalTestId: test.testId,
        markedIds: test.markedIds || []
      }
    }));
    router.push("/app/qbank/take-test");
  };

  const handleViewSummary = (test) => {
    localStorage.setItem("medbank_last_test_id", test.testId);
    router.push("/app/qbank/test-summary");
  };

  const handleDeleteTest = (id) => {
    if (confirm("Delete this test from history?")) {
      const userId = localStorage.getItem("medbank_user");
      const historyKey = `medbank_test_history_${userId}`;
      const updated = tests.filter(t => t.testId !== id);
      setTests(updated);
      localStorage.setItem(historyKey, JSON.stringify(updated));
    }
  };

  const filteredTests = tests.filter(test => {
    if (activeTab === "completed") return !test.isSuspended;
    if (activeTab === "suspended") return test.isSuspended;
    return true;
  });

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTests = filteredTests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-[#f4f7f9] min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#002b5c] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#002b5c] tracking-tight">Previous Tests</h1>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Dashboard / Test History</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
               {['All', 'Completed', 'Suspended'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab.toLowerCase())}
                   className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.toLowerCase() ? 'bg-white text-[#002b5c] shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                 >
                   {tab}
                 </button>
               ))}
             </div>
             <button 
               onClick={() => router.push("/app/qbank/create-test")}
               className="bg-[#00bbd4] hover:bg-[#00acc1] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
             >
               + Create New
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto p-8">
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           {[
             { label: 'Total Tests', value: tests.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
             { label: 'Completed', value: tests.filter(t => !t.isSuspended).length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
             { label: 'Suspended', value: tests.filter(t => t.isSuspended).length, icon: Play, color: 'text-orange-500', bg: 'bg-orange-50' },
             { label: 'Avg Score', value: tests.filter(t => !t.isSuspended).length > 0 ? `${Math.round(tests.filter(t => !t.isSuspended).reduce((acc, t) => acc + (t.questions.filter(q => q.userAnswer === q.correct).length / t.questions.length), 0) / tests.filter(t => !t.isSuspended).length * 100)}%` : '--', icon: BarChart, color: 'text-purple-500', bg: 'bg-purple-50' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-5">
               <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                 <stat.icon size={26} />
               </div>
               <div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</span>
                 <p className="text-2xl font-black text-[#002b5c]">{stat.value}</p>
               </div>
             </div>
           ))}
        </div>

        {/* Table Interface */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
             <div className="flex items-center gap-2">
               <LayoutList size={18} className="text-[#002b5c]" />
               <h3 className="text-[13px] font-black uppercase tracking-widest text-[#002b5c]">Testing Log</h3>
             </div>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="text" placeholder="Search Test ID..." className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-[12px] focus:outline-none focus:border-[#00bbd4] w-64 transition-all" />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
                  <th className="px-8 py-5">#</th>
                  <th className="px-8 py-5">Date / Time</th>
                  <th className="px-8 py-5">Test ID</th>
                  <th className="px-8 py-5">Mode</th>
                  <th className="px-8 py-5">Items</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Score</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {paginatedTests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <History size={48} className="text-zinc-200 mb-4" />
                        <h4 className="text-zinc-400 font-bold uppercase tracking-widest text-[11px]">No tests found in this category</h4>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTests.map((test, index) => {
                    const correctCount = (test.questions || []).filter(q => q.userAnswer === q.correct).length;
                    const totalCount = (test.questions || []).length;
                    const omittedCount = (test.questions || []).filter(q => !q.userAnswer).length;
                    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
                    
                    return (
                      <tr key={test.testId} className="hover:bg-zinc-50/80 transition-all group">
                        <td className="px-8 py-6 text-[13px] font-bold text-[#002b5c]">
                          #{test.testNumber || 0}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                             <span className="text-[13px] font-bold text-zinc-800">{new Date(test.date).toLocaleDateString()}</span>
                             <span className="text-[10px] font-medium text-zinc-400">{new Date(test.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[12px] font-black text-[#002b5c] font-mono">{test.testId}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="inline-block px-3 py-1 bg-[#002b5c]/5 rounded-lg text-[10px] font-black uppercase text-[#002b5c] tracking-wider">
                             {test.mode}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                             <span className="text-[13px] font-black text-zinc-700">{totalCount} Questions</span>
                             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                               {test.isSuspended ? `${Object.keys(test.answers || {}).length} Answered` : (omittedCount > 0 ? `${omittedCount} Omitted` : 'All Answered')}
                             </span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${test.isSuspended ? 'bg-orange-50 text-orange-500' : (omittedCount > 0 ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500')}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${test.isSuspended ? 'bg-orange-500' : (omittedCount > 0 ? 'bg-blue-500' : 'bg-green-500')} ${test.isSuspended ? 'animate-pulse' : ''}`} />
                             {test.isSuspended ? 'Suspended' : (omittedCount > 0 ? 'Incomplete' : 'Completed')}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           {test.isSuspended ? (
                             <span className="text-[11px] font-bold text-zinc-300 uppercase italic">In Progress</span>
                           ) : (
                             <div className="flex items-center gap-3">
                               <span className="text-[15px] font-black text-zinc-800">{percentage}%</span>
                               <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                 <div className={`h-full ${percentage >= 70 ? 'bg-green-500' : 'bg-[#00bbd4]'}`} style={{ width: `${percentage}%` }} />
                               </div>
                             </div>
                           )}
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                             {test.isSuspended ? (
                               <button 
                                 onClick={() => handleResume(test)}
                                 className="bg-[#002b5c] text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/10 hover:bg-[#001d3d] transition-all flex items-center gap-2"
                               >
                                 <Play size={14} fill="currentColor" />
                                 Resume
                               </button>
                             ) : (
                               <>
                                 {omittedCount > 0 && (
                                   <button 
                                     onClick={() => handleResume(test, true)}
                                     className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
                                   >
                                     <RotateCcw size={14} />
                                     Resume Omitted
                                   </button>
                                 )}
                                 <button 
                                   onClick={() => handleViewSummary(test)}
                                   className="bg-zinc-100 text-[#002b5c] px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#002b5c] hover:text-white transition-all flex items-center gap-2"
                                 >
                                   <Eye size={16} />
                                   Review
                                 </button>
                               </>
                             )}
                             <button 
                               onClick={() => handleDeleteTest(test.testId)}
                               className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                             >
                               <Trash2 size={18} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-8 py-6 bg-zinc-50/30 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTests.length)} of {filteredTests.length} Tests
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#002b5c] bg-white hover:bg-zinc-50 disabled:opacity-30 transition-all flex items-center gap-2"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${currentPage === i + 1 ? 'bg-[#002b5c] text-white shadow-lg shadow-blue-900/20' : 'bg-white text-zinc-400 hover:text-[#002b5c] border border-zinc-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#002b5c] bg-white hover:bg-zinc-50 disabled:opacity-30 transition-all flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
