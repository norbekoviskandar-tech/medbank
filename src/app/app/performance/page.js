"use client";

import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceDot, ReferenceLine
} from 'recharts';
import { Printer, Info } from 'lucide-react';
import { getAllQuestions } from "@/services/question.service";

export default function Performance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    omitted: 0,
    totalAnswered: 0,
    used: 0,
    unused: 0,
    totalQuestions: 0,
    testsCreated: 0,
    testsCompleted: 0,
    suspendedTests: 0,
    percentile: 0
  });

  // Mock bell curve data
  const bellCurveData = Array.from({ length: 100 }, (_, i) => {
    const x = i;
    const mean = 50;
    const stdDev = 15;
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    return { x, y: y * 1000 }; // Scale y for better visibility
  });

  useEffect(() => {
    async function loadData() {
      try {
        const userId = localStorage.getItem("medbank_user");
        const allQuestions = await getAllQuestions();
        const storedStats = JSON.parse(localStorage.getItem(`medbank_qbank_stats_${userId}`) || "{}");
        const history = JSON.parse(localStorage.getItem(`medbank_test_history_${userId}`) || "[]");

        let correct = 0;
        let incorrect = 0; 
        let omitted = 0;

        // Calculate from stats which tracks unique question attempts (or aggregate from history for all attempts?)
        // Usually performance aggregates all attempts or unique? UWorld is usually unique or primary.
        // We will use the history for precise session data if possible, but stats object is easier for "Used" count.
        
        // Let's iterate history for test counts and accurate answer totals
        if (history) {
           history.forEach(test => {
             if (test.questions) {
               test.questions.forEach(q => {
                 if (q.userAnswer === q.correct) correct++;
                 else if (!q.userAnswer) omitted++;
                 else incorrect++;
               });
             }
           });
        }

        const totalUsed = Object.keys(storedStats).length;
        const total = allQuestions.filter(q => q.published).length; // Only count published questions

        setStats({
          correct,
          incorrect,
          omitted,
          totalAnswered: correct + incorrect + omitted,
          used: totalUsed,
          unused: Math.max(0, total - totalUsed),
          totalQuestions: total,
          testsCreated: history.length,
          testsCompleted: history.filter(t => !t.isSuspended).length,
          suspendedTests: history.filter(t => t.isSuspended).length,
          percentile: Math.min(99, Math.floor((correct / (correct + incorrect + omitted || 1)) * 100)) // Naive percentile
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8">Loading stats...</div>;

  const correctPercentage = stats.totalAnswered > 0 ? Math.round((stats.correct / stats.totalAnswered) * 100) : 0;
  const unusedPercentage = stats.totalQuestions > 0 ? Math.round((stats.unused / stats.totalQuestions) * 100) : 100;

  return (
    <div className="bg-white min-h-screen font-sans text-slate-700">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-8">
        <h1 className="text-2xl font-light text-slate-800">Statistics</h1>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 text-[#005eb8] hover:text-[#004e92] font-medium text-sm print:hidden"
        >
          <Printer size={16} />
          <span>Print</span>
        </button>
      </div>

      <div className="space-y-12">
        {/* Row 1: Score & Changes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Big Circle Chart */}
           <div className="lg:col-span-3 flex flex-col items-center justify-center">
             <div className="relative w-40 h-40">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                 <circle 
                   cx="80" cy="80" r="70" 
                   stroke="#10b981" 
                   strokeWidth="12" 
                   fill="none" 
                   strokeDasharray={440}
                   strokeDashoffset={440 - (440 * correctPercentage / 100)}
                   className="transition-all duration-1000 ease-out"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-3xl font-bold text-slate-800">{correctPercentage}%</span>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Correct</span>
               </div>
             </div>
           </div>

           {/* Tables */}
           <div className="lg:col-span-4 space-y-4">
             <h3 className="text-[#005eb8] font-medium text-sm uppercase tracking-wide">Your Score</h3>
             <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
               <StatRow label="Total Correct" value={stats.correct} />
               <StatRow label="Total Incorrect" value={stats.incorrect} />
               <StatRow label="Total Omitted" value={stats.omitted} isLast />
             </div>
           </div>

           <div className="lg:col-span-5 space-y-4">
             <h3 className="text-[#005eb8] font-medium text-sm uppercase tracking-wide">Answer Changes</h3>
             <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
               <StatRow label="Correct to Incorrect" value={0} />
               <StatRow label="Incorrect to Correct" value={0} />
               <StatRow label="Incorrect to Incorrect" value={0} isLast />
             </div>
           </div>
        </div>

        {/* Row 2: Usage & Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-100 pt-8">
           {/* Big Circle Chart 2 */}
           <div className="lg:col-span-3 flex flex-col items-center justify-center">
             <div className="relative w-40 h-40">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                 <circle 
                   cx="80" cy="80" r="70" 
                   stroke="#64748b" 
                   strokeWidth="12" 
                   fill="none" 
                   strokeDasharray={440}
                   strokeDashoffset={440 - (440 * unusedPercentage / 100)}
                   className="transition-all duration-1000 ease-out"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-3xl font-bold text-slate-800">{unusedPercentage}%</span>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unused</span>
               </div>
             </div>
           </div>

           {/* Tables */}
           <div className="lg:col-span-4 space-y-4">
             <h3 className="text-[#005eb8] font-medium text-sm uppercase tracking-wide">QBank Usage</h3>
             <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
               <StatRow label="Used Questions" value={stats.used} />
               <StatRow label="Unused Questions" value={stats.unused} />
               <StatRow label="Total Questions" value={stats.totalQuestions} isLast />
             </div>
           </div>

           <div className="lg:col-span-5 space-y-4">
             <h3 className="text-[#005eb8] font-medium text-sm uppercase tracking-wide">Test Count</h3>
             <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
               <StatRow label="Tests Created" value={stats.testsCreated} />
               <StatRow label="Tests Completed" value={stats.testsCompleted} />
               <StatRow label="Suspended Tests" value={stats.suspendedTests} isLast />
             </div>
           </div>
        </div>

        {/* Row 3: Bell Curve */}
        <div className="pt-8 border-t border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-80">
              <h3 className="text-[#005eb8] font-medium text-sm uppercase tracking-wide mb-6">Percentile Rank</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bellCurveData}>
                  <defs>
                    <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  {/* The Bell Curve */}
                  <Area 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCurve)" 
                  />
                  
                  {/* Your Score Dot */}
                  <ReferenceDot 
                    x={stats.percentile} 
                    y={bellCurveData[stats.percentile]?.y} 
                    r={6} 
                    fill="#10b981" 
                    stroke="white" 
                    strokeWidth={2} 
                  />
                  
                  {/* Median Score Dot */}
                  <ReferenceDot 
                    x={50} 
                    y={bellCurveData[50]?.y} 
                    r={6} 
                    fill="#3b82f6" 
                    stroke="white" 
                    strokeWidth={2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              {/* X Axis Labels */}
              <div className="flex justify-between text-xs text-slate-400 mt-2 px-4 font-mono">
                <span>0th</span>
                <span>50th</span>
                <span>100th</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-center space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-slate-600">Your Score ({stats.percentile}th rank)</span>
                </div>
                <span className="font-bold text-slate-800">{correctPercentage}%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-slate-600">Median Score (50th rank)</span>
                </div>
                <span className="font-bold text-slate-800">48%</span>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Your Average Time Spent</span>
                  <span className="font-mono font-bold text-slate-700">62 sec</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Others Average Time Spent</span>
                  <span className="font-mono font-bold text-slate-700">54 sec</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, isLast }) {
  return (
    <div className={`flex justify-between items-center p-3 ${!isLast ? 'border-b border-slate-200/50' : ''}`}>
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm min-w-[3rem] text-center">
        {value}
      </span>
    </div>
  );
}
