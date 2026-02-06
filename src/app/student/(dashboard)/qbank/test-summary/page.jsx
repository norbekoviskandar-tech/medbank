"use client";

import { useEffect, useState, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { 
   Eye, CheckCircle2, XCircle,
   MinusCircle, GraduationCap, Clock, FileText, ChevronLeft, Info,
   Check, X, Minus, Plus, ChevronDown
} from "lucide-react";
import { getTestById, getAllTests } from "@/services/test.service";

function ScoreDonut({ stats }) {
   const [hovered, setHovered] = useState(null);
   const radius = 90;
   const circumference = 2 * Math.PI * radius;

   const cP = stats.correct / stats.total;
   const iP = stats.incorrect / stats.total;
   const oP = stats.omitted / stats.total;

   // Start from top (-90deg)
   const cO = 0;
   const iO = -(cP * circumference);
   const oO = -((cP + iP) * circumference);

   return (
      <div className="relative w-full h-full flex items-center justify-center">
         <svg className="w-full h-full transform -rotate-90 scale-100" viewBox="0 0 224 224">
            {/* Omitted */}
            <circle
               cx="112" cy="112" r={hovered === 'omitted' ? radius + 3 : radius}
               stroke={hovered === 'omitted' ? "#334155" : "#1e293b"}
               strokeWidth={hovered === 'omitted' ? "30" : "24"}
               fill="transparent"
               strokeDasharray={`${oP * circumference} ${circumference}`}
               strokeDashoffset={oO}
               className="transition-all duration-300 cursor-pointer"
               onMouseEnter={() => setHovered('omitted')}
               onMouseLeave={() => setHovered(null)}
            />
            {/* Incorrect */}
            <circle
               cx="112" cy="112" r={hovered === 'incorrect' ? radius + 3 : radius}
               stroke={hovered === 'incorrect' ? "#ef4444" : "#7f1d1d"}
               strokeWidth={hovered === 'incorrect' ? "30" : "24"}
               fill="transparent"
               strokeDasharray={`${iP * circumference} ${circumference}`}
               strokeDashoffset={iO}
               className="transition-all duration-300 cursor-pointer"
               onMouseEnter={() => setHovered('incorrect')}
               onMouseLeave={() => setHovered(null)}
            />
            {/* Correct */}
            <circle
               cx="112" cy="112" r={hovered === 'correct' ? radius + 3 : radius}
               stroke={hovered === 'correct' ? "#22c55e" : "#14532d"}
               strokeWidth={hovered === 'correct' ? "30" : "24"}
               fill="transparent"
               strokeDasharray={`${cP * circumference} ${circumference}`}
               strokeDashoffset={cO}
               className="transition-all duration-300 cursor-pointer"
               onMouseEnter={() => setHovered('correct')}
               onMouseLeave={() => setHovered(null)}
            />
         </svg>
         <div className="absolute flex flex-col items-center pointer-events-none">
            <span className={`text-4xl font-black transition-all duration-300 ${hovered === 'correct' ? 'text-green-500 scale-110' : hovered === 'incorrect' ? 'text-red-500 scale-110' : 'text-zinc-200'}`}>
               {stats.percentage}%
            </span>
            <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest">Correct</span>
         </div>
      </div>
   );
}


export default function TestSummaryPage() {
  const { selectedStudentProduct } = useContext(AppContext);
  const [testResult, setTestResult] = useState(null);
   const [activeTab, setActiveTabState] = useState("results"); // results, analysis
   const [copySuccess, setCopySuccess] = useState(null);
   const [isTemplateB, setIsTemplateB] = useState(false);

   useEffect(() => {
     if (!selectedStudentProduct?.id) return;

     const val =
       typeof window !== "undefined"
         ? localStorage.getItem(`medbank_product_templateType_${selectedStudentProduct.id}`)
         : null;

     if (val === "ECG" || selectedStudentProduct?.templateType === "ECG") {
       setIsTemplateB(true);
     }
   }, [selectedStudentProduct]);

   const setActiveTab = (tab) => {
      setActiveTabState(tab);
      localStorage.setItem("medbank_summary_tab", tab);
   };
   const [filter, setFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
     async function loadResult() {
        // STRICT ATTEMPT-FIRST: summary must query by attempt id only
        const attemptId = localStorage.getItem("medbank_last_attempt_id");
        if (!attemptId) {
          router.push("/student/qbank/create-test");
          return;
        }

        // Route /api/tests/[id] will return attempt when id is attemptId; productId not required for attempt lookup
        const productId = selectedStudentProduct?.id || localStorage.getItem("medbank_selected_package") || "14";
        const result = await getTestById(attemptId, productId);
        if (!result) {
          router.push("/student/qbank/create-test");
          return;
        }

        // Apply chronological numbering matching history page
        if (!result.testNumber) {
          const history = await getAllTests(productId);
          const sorted = history.sort((a, b) => new Date(a.date) - new Date(b.date));
          const idx = sorted.findIndex(t => String(t.testId) === String(result.testId));
          result.testNumber = idx !== -1 ? idx + 1 : history.length + 1;
        }

        setTestResult(result);
     }

     loadResult();

     const savedTab = localStorage.getItem("medbank_summary_tab");
     if (savedTab) {
        setActiveTab(savedTab);
     }
  }, [router, selectedStudentProduct]);

   const stats = useMemo(() => {
     if (!testResult) return null;

     const attemptAnswers = Array.isArray(testResult.attemptAnswers) ? testResult.attemptAnswers : [];

     const total = Number.isFinite(testResult.totalQuestions)
       ? testResult.totalQuestions
       : attemptAnswers.length;

     let correct = 0;
     let incorrect = 0;
     let omitted = 0;
     let flagged = 0;
     const finishedAt = testResult.finishedAt;

     attemptAnswers.forEach(a => {
       if (a.isFlagged) flagged++;

       const hasAnswer = a.selectedOption !== null && a.selectedOption !== undefined;
       if (hasAnswer) {
         if (a.isCorrect) correct++;
         else incorrect++;
       } else if (finishedAt) {
         omitted++;
       }
     });

     const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

     // Enrich attemptAnswers with real question data (subject/system/topic) if available
     const enrichedAnswers = attemptAnswers.map(a => {
       const question = testResult.questions?.find(q => String(q.id) === String(a.questionId));
       if (question) {
         return {
           ...a,
           subject: question.subject || a.subject,
           system: question.system || a.system,
           topic: question.topic || a.topic
         };
       }
       return a;
     });

     // Summary is read-only; we do not compute subject stats without frozen question snapshots.
     return {
       total,
       correct,
       incorrect,
       omitted,
       flagged,
       percentage,
       attemptAnswers: enrichedAnswers
     };
   }, [testResult]);

   const handleCopyId = (id) => {
      navigator.clipboard.writeText(id).then(() => {
         setCopySuccess(id);
         setTimeout(() => setCopySuccess(null), 2000);
      });
   };

   const handleReview = () => {
    localStorage.setItem("medbank_current_test", JSON.stringify({
      ...testResult,
       questions: testResult.questions.map(q => typeof q === 'object' ? q.id : q),
       testAttemptId: testResult.testAttemptId || testResult.id || null,
       isReview: true
    }));
    router.push("/student/qbank/take-test");
  };

   if (!testResult || !stats) return null;

   return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0F0F12] font-sans pb-20 select-none transition-colors duration-300">
         {/* HEADER */}
         <div className="bg-white dark:bg-[#16161a] border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0072bc] rounded flex items-center justify-center text-white">
                     <FileText size={20} />
                  </div>
                  <div className="flex items-baseline gap-3">
                     <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Number</span>
                     <h1 className="text-2xl font-black text-[#3b82f6]">
                        {testResult.testNumber || 1}
                     </h1>
                  </div>
               </div>

            </div>
         </div>

         <div className="max-w-[1400px] mx-auto px-10 py-8">
            {/* ACTION BAR */}
            <div className="flex items-center justify-between mb-8">
               <button
                  onClick={() => router.push("/student/tests")}
                  className="flex items-center gap-2 text-[#0072bc] hover:text-[#005a96] transition-colors font-medium text-[14px]"
               >
                  <ChevronLeft size={18} />
                  Previous Tests
               </button>
               <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-zinc-500 text-[13px] hover:text-zinc-700 cursor-pointer">
                     <FileText size={16} /> Notes
                  </span>

                  <button
                     onClick={handleReview}
                     className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2 rounded font-medium text-[13px] transition-all"
                  >
                     Review Test
                  </button>
               </div>
            </div>

            {/* TABS */}
            <div className="flex items-center justify-between border-b border-zinc-200 mb-8 relative">
               <div className="flex gap-12">
                  <button
                     onClick={() => setActiveTab("results")}
                     className={`pb-4 text-[15px] font-medium transition-all relative ${activeTab === 'results' ? 'text-zinc-800' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                     Test Results
                     {activeTab === 'results' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3b82f6]" />}
                  </button>
                  <button
                     onClick={() => setActiveTab("analysis")}
                     className={`pb-4 text-[15px] font-medium transition-all relative ${activeTab === 'analysis' ? 'text-zinc-800' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                     Test Analysis
                     {activeTab === 'analysis' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3b82f6]" />}
                  </button>
               </div>
               <div 
                  className="flex items-center gap-2 pb-4 text-[13px] text-zinc-500 cursor-copy select-none relative group"
                  onDoubleClick={() => handleCopyId(testResult.testId)}
                  title="Double-click to copy"
               >
                  Custom Test Id: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{testResult.testId}</span>
                  <Info size={14} className="text-zinc-300" />
                  {copySuccess === testResult.testId && (
                     <span className="absolute -top-1 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 font-bold whitespace-nowrap z-50">
                        COPIED!
                     </span>
                  )}
               </div>
            </div>

            {activeTab === "results" ? (
               <div className="space-y-12 animate-in fade-in duration-500">
                  {/* SCORE BAR SECTION */}
                  <div className="grid grid-cols-2 gap-20 py-8">
                     <div className="flex flex-col items-center">
                        <h3 className="text-[13px] font-medium text-zinc-500 mb-6">Your Score</h3>
                        <div className="w-full relative px-2">
                           {/* Label Container */}
                           <div className="relative h-12 w-full mb-1">
                              {/* Your Score Label */}
                              <div
                                 className="absolute flex flex-col items-center transition-all duration-1000"
                                 style={{
                                    left: `${stats.percentage}%`,
                                    transform: 'translateX(-50%)',
                                    color: stats.percentage > 0 ? '#22c55e' : '#94a3b8'
                                 }}
                              >
                                 <span className="text-[12px] font-black whitespace-nowrap">
                                    {stats.percentage}%
                                 </span>
                                 <div className={`w-2 h-2 rotate-45 mt-1 ${stats.percentage > 0 ? 'bg-green-500' : 'bg-zinc-400'}`} />
                              </div>
                           </div>

                           {/* Bar Container with Outline */}
                           <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center relative shadow-sm">
                              {/* Filled Bar */}
                              <div
                                 className="h-full bg-[#22c55e] absolute left-0 top-0 transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                 style={{ width: `${stats.percentage}%` }}
                              />

                              {/* Scale Markings */}
                              <div className="absolute left-0 h-full w-[1px] bg-zinc-300 dark:bg-zinc-700 z-10" />
                              <div className="absolute right-0 h-full w-[1px] bg-zinc-300 dark:bg-zinc-700 z-10" />

                              {/* Average marker */}
                              <div className="absolute left-[47%] h-full w-0.5 bg-zinc-400/50 z-20">
                                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Avg: 47%</div>
                              </div>
                           </div>

                           {/* Bottom Markers */}
                           <div className="flex justify-between mt-2 px-0.5">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">0%</span>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">100% Correct</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-6">
                        <h3 className="text-[13px] font-medium text-zinc-500">Test Settings</h3>
                        <div className="grid grid-cols-[120px_1fr] items-center gap-y-4 text-[13px]">
                           <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Mode</span>
                           <div className="flex gap-2">
                              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded text-zinc-600 dark:text-zinc-300 uppercase text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 transition-colors">
                                 {testResult.mode === 'tutor' ? 'Tutor' : 'Timed'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* RESULTS TABLE */}
                  <div className="mt-12 bg-white dark:bg-[#16161a] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-white dark:bg-[#16161a] text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                              <th className="px-12 py-6"># ID</th>
                              <th className="px-12 py-6">Subjects</th>
                              <th className="px-12 py-6">Systems</th>
                              <th className="px-12 py-6">Topics</th>
                              <th className="px-12 py-6">% Correct Others</th>
                              <th className="px-12 py-6">Time Spent</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                           {stats.attemptAnswers.map((a, idx) => {
                              const isOmitted = a.selectedOption === null || a.selectedOption === undefined;
                              const isCorrect = !isOmitted && !!a.isCorrect;
                              const attemptKey = testResult.testAttemptId || testResult.testId || 'attempt';
                              
                              // Helper to format subject/system display
                              const formatDisplay = (value, type) => {
                                if (!value) return '--';
                                // If it's a string with commas, treat as multiple
                                const items = typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : [value];
                                if (items.length === 0) return '--';
                                if (items.length > 1) return 'Multiple';
                                const single = items[0];
                                // For Template B (ECG) products, format system as "Cardiology-ECG" if it's Cardiology
                                if (type === 'system' && isTemplateB && single.toLowerCase() === 'cardiology') {
                                  return 'Cardiology-ECG';
                                }
                                // Truncate long strings
                                return single.length > 15 ? single.substring(0, 15) + '...' : single;
                              };
                              
                              const displaySubject = formatDisplay(a.subject, 'subject');
                              const displaySystem = formatDisplay(a.system, 'system');
                              const displayTopic = a.topic || 'Standard Item';
                              
                              return (
                                 <tr key={`${String(a.questionId)}-${attemptKey}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors group">
                                    <td className="px-12 py-7 flex items-center gap-6">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isOmitted ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' :
                                          isCorrect ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'
                                          }`}>
                                          {isOmitted ? <Minus size={14} className="stroke-[4]" /> :
                                             isCorrect ? <Check size={18} className="stroke-[4]" /> :
                                                <X size={18} className="stroke-[4]" />}
                                       </div>
                                       <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                             <span className="text-[15px] font-bold text-zinc-400 tracking-tight">
                                                {idx + 1} - <span className="text-zinc-700 dark:text-zinc-300">{a.questionId}</span>
                                             </span>
                                             {a.isFlagged && (
                                                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-1 rounded">
                                                   <Eye size={12} className="fill-current" />
                                                </div>
                                             )}
                                          </div>
                                          {isOmitted && <span className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mt-0.5">Omitted</span>}
                                       </div>
                                    </td>
                                    <td className="px-12 py-7">
                                       <span className="text-[15px] font-bold text-zinc-500 dark:text-zinc-400">{displaySubject}</span>
                                    </td>
                                    <td className="px-12 py-7">
                                       <span className="text-[15px] font-bold text-zinc-500 dark:text-zinc-400">{displaySystem}</span>
                                    </td>
                                    <td className="px-12 py-7">
                                       <span className="text-[15px] font-bold text-zinc-400 dark:text-zinc-600">{displayTopic}</span>
                                    </td>
                                    <td className="px-12 py-7">
                                       <span className="text-[15px] font-bold text-zinc-500 dark:text-zinc-400">{a.percentCorrectOthers || '--'}</span>
                                    </td>
                                    <td className="px-12 py-7 text-[15px] font-bold text-zinc-500 dark:text-zinc-400">{a.timeSpentSec || 0} sec</td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            ) : (
               <div className="space-y-12 animate-in fade-in duration-500">
                  {/* ANALYSIS GRAPHS SECTION */}
                  <div className="grid grid-cols-12 gap-8 py-8 items-start">
                     <div className="col-span-4 flex flex-col items-center justify-center pt-8">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                           <ScoreDonut stats={stats} />
                        </div>
                     </div>

                     <div className="col-span-4 flex flex-col border-r border-zinc-100 dark:border-zinc-800 pr-12">
                        <h3 className="text-[14px] font-medium text-zinc-700 dark:text-zinc-300 mb-6 font-medium">Your Score</h3>
                        <div className="space-y-4">
                           {[
                              { label: 'Total Correct', value: stats.correct },
                              { label: 'Total Incorrect', value: stats.incorrect },
                              { label: 'Total Omitted', value: stats.omitted },
                              { label: 'Total Flagged', value: stats.flagged }
                           ].map((item, i) => (
                              <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors">
                                 <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                 <span className={`bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded text-[12px] font-black ${item.label.includes('Correct') ? 'text-green-600' : item.label.includes('Incorrect') ? 'text-red-600' : 'text-zinc-600 dark:text-zinc-300'}`}>{item.value}</span>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="col-span-4 flex flex-col" />
                  </div>
               </div>
            )}

        </div>

         {/* FOOTER */}
         <footer className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#16161a] border-t border-zinc-200 dark:border-zinc-800 py-3 text-center transition-colors">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Copyright © MedBank. All rights reserved.</span>
         </footer>
    </div>
  );
}
