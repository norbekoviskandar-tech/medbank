"use client";

import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceDot, ReferenceLine
} from 'recharts';
import { Printer, Info } from 'lucide-react';
import { getAllQuestions } from "@/services/question.service";
import { getAllTests } from "@/services/test.service";
import { getStudentCognition } from "@/services/analytics.service";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";


export default function Performance() {
  const { selectedStudentProduct } = useContext(AppContext);
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
    percentile: 0,
    readinessScore: 0,
    overthinkingIndex: 0,
    impulsivityIndex: 0,
    fatigueFactor: 0
  });

  const [hoveredScore, setHoveredScore] = useState(null); // 'correct', 'incorrect', 'omitted'

  // Mock bell curve data
  const bellCurveData = Array.from({ length: 100 }, (_, i) => {
    const x = i;
    const mean = 50;
    const stdDev = 15;
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    return { x, y: y * 1000 }; // Scale y for better visibility
  });

  // Reactivity to context handled by useEffect[selectedStudentProduct]

  // Reactivity to context handled by useEffect[selectedStudentProduct]

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const pId = selectedStudentProduct?.id;
      try {
        const productStats = await import("@/services/analytics.service").then(m => m.getUserProductStats(pId));
        const allQuestions = await getAllQuestions(pId);
        const history = await getAllTests(pId);

        let corToInc = 0;
        let incToCor = 0;
        let incToInc = 0;
        let totalTime = 0;
        let totalQsForTime = 0;

        if (history) {
           history.forEach(test => {
             if (test.questions) {
               const firsts = test.firstAnswers || {};
               const finals = test.answers || {};

               test.questions.forEach(qItem => {
                 const id = typeof qItem === 'string' ? qItem : qItem.id;
                 const correctAns = qItem.correct;
                 const firstAns = firsts[id];
                 const finalAns = finals[id] || qItem.userAnswer;

                 // Logic for Answer Changes
                 if (firstAns && finalAns && firstAns !== finalAns) {
                   if (firstAns === correctAns && finalAns !== correctAns) corToInc++;
                   else if (firstAns !== correctAns && finalAns === correctAns) incToCor++;
                   else if (firstAns !== correctAns && finalAns !== correctAns) incToInc++;
                 }
               });

               // Time Stats (only from non-suspended tests)
               if (!test.isSuspended) {
                 totalTime += (test.elapsedTime || 0);
                 totalQsForTime += (test.questions.length || 0);
               }
             }
           });
        }

        const avgTime = totalQsForTime > 0 ? Math.round(totalTime / totalQsForTime) : 0;

        // Forensic Volatility Calculation
        let totalVolatilitySteps = 0;
        if (history) {
            history.forEach(test => {
                if (test.sessionState?.logs) {
                    const logs = test.sessionState.logs;
                    const answerChanges = logs.filter(l => l.action === 'select_answer' || l.action === 'deselect_answer');
                    totalVolatilitySteps += answerChanges.length;
                }
            });
        }

        const cognition = await getStudentCognition(pId);

        setStats({
          correct: productStats.correctAnswers,
          incorrect: productStats.incorrectAnswers,
          omitted: productStats.omittedAnswers,
          totalAnswered: productStats.totalAnswered,
          used: productStats.usedQuestions,
          unused: productStats.unusedQuestions,
          totalQuestions: productStats.totalQuestions,
          testsCreated: history.length,
          testsCompleted: history.filter(t => !t.isSuspended).length,
          suspendedTests: history.filter(t => t.isSuspended).length,
          corToInc,
          incToCor,
          incToInc,
          avgTime: avgTime,
          avgVolatility: (productStats.correctAnswers + productStats.incorrectAnswers) > 0 
            ? (totalVolatilitySteps / (productStats.correctAnswers + productStats.incorrectAnswers)).toFixed(1) 
            : 0,
          percentile: Math.min(99, Math.floor((productStats.correctAnswers / (productStats.correctAnswers + productStats.incorrectAnswers || 1)) * 100)),
          readinessScore: cognition?.readinessScore || 0,
          overthinkingIndex: (cognition?.overthinkingIndex * 10 || 0).toFixed(1),
          impulsivityIndex: (cognition?.impulsivityIndex * 10 || 0).toFixed(1),
          fatigueFactor: (cognition?.fatigueFactor * 100 || 0).toFixed(0)
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Listen for progress refresh events
    window.addEventListener("medbank_progress_refresh", loadData);
    return () => window.removeEventListener("medbank_progress_refresh", loadData);
  }, [selectedStudentProduct]);

  if (loading) return <div className="p-8">Loading stats...</div>;

  const total = stats.totalAnswered || 1;
  const pCorrect = Math.round((stats.correct / total) * 100) || 0;
  const pIncorrect = Math.round((stats.incorrect / total) * 100) || 0;
  const pOmitted = Math.max(0, 100 - pCorrect - pIncorrect);
  const usedPercentage = stats.totalQuestions > 0 ? Math.round(((stats.totalQuestions - stats.unused) / stats.totalQuestions) * 100) : 0;

  // Values for center display
  const displayValue = hoveredScore === 'incorrect' ? pIncorrect : hoveredScore === 'omitted' ? pOmitted : pCorrect;
  const displayLabel = hoveredScore === 'incorrect' ? "Incorrect" : hoveredScore === 'omitted' ? "Omitted" : "Correct";

  return (
    <div className="bg-background min-h-screen font-sans text-foreground transition-colors duration-300">

      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-bold text-foreground">Performance Statistics</h1>
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
            <div className="relative w-40 h-40 group cursor-default">
               <svg className="w-full h-full transform -rotate-90">
                {/* Background base */}
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" className="dark:stroke-zinc-800" />

                {/* Omitted Segment */}
                <circle
                  cx="80" cy="80" r="70"
                  stroke="#334155"
                  strokeWidth={hoveredScore === 'omitted' ? "16" : "12"}
                  fill="none"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * pOmitted / 100)}
                  className="transition-all duration-300 ease-out cursor-pointer"
                  onMouseEnter={() => setHoveredScore('omitted')}
                  onMouseLeave={() => setHoveredScore(null)}
                  style={{ transform: `rotate(${((pCorrect + pIncorrect) * 360 / 100)}deg)`, transformOrigin: '80px 80px' }}
                />

                {/* Incorrect Segment */}
                <circle
                  cx="80" cy="80" r="70"
                  stroke="#991b1b"
                  strokeWidth={hoveredScore === 'incorrect' ? "16" : "12"}
                  fill="none"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * pIncorrect / 100)}
                  className="transition-all duration-300 ease-out cursor-pointer"
                  onMouseEnter={() => setHoveredScore('incorrect')}
                  onMouseLeave={() => setHoveredScore(null)}
                  style={{ transform: `rotate(${(pCorrect * 360 / 100)}deg)`, transformOrigin: '80px 80px' }}
                />

                {/* Correct Segment */}
                 <circle 
                   cx="80" cy="80" r="70" 
                   stroke="#10b981" 
                  strokeWidth={hoveredScore === null || hoveredScore === 'correct' ? "16" : "12"} 
                   fill="none" 
                   strokeDasharray={440}
                  strokeDashoffset={440 - (440 * pCorrect / 100)}
                  className="transition-all duration-300 ease-out cursor-pointer"
                  onMouseEnter={() => setHoveredScore('correct')}
                  onMouseLeave={() => setHoveredScore(null)}
                 />
               </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{displayValue}%</span>
                <span className="text-[10px] font-black text-muted-foreground dark:text-zinc-300 uppercase tracking-widest">{displayLabel}</span>
               </div>
             </div>
           </div>

           {/* Tables */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[#005eb8] dark:text-blue-400 font-bold text-xs uppercase tracking-widest">Your Score</h3>
            <div className="bg-card rounded-lg p-1 border border-border">
              <StatRow label="Total Correct" value={stats.correct} />
              <StatRow label="Total Incorrect" value={stats.incorrect} />
              <StatRow label="Total Omitted" value={stats.omitted} isLast />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-[#005eb8] dark:text-blue-400 font-bold text-xs uppercase tracking-widest">Answer Changes & Volatility</h3>
            <div className="bg-card rounded-lg p-1 border border-border">
              <StatRow label="Correct to Incorrect (Second-Guess)" value={stats.corToInc} />
              <StatRow label="Incorrect to Correct (Recovery)" value={stats.incToCor} />
              <StatRow label="Avg Question Volatility" value={stats.avgVolatility} isLast />
            </div>
          </div>
        </div>

        {/* Row 2: Usage & Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-border pt-8">
          {/* Big Circle Chart 2 */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" className="dark:stroke-zinc-800" />
                <circle
                  cx="80" cy="80" r="70"
                  stroke="#0ea5e9"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * usedPercentage / 100)}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{usedPercentage}%</span>
                <span className="text-[10px] font-black text-muted-foreground dark:text-zinc-300 uppercase tracking-widest">Used</span>
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[#005eb8] dark:text-blue-400 font-bold text-xs uppercase tracking-widest">QBank Usage</h3>
            <div className="bg-card rounded-lg p-1 border border-border">
              <StatRow label="Used Questions" value={stats.used} />
              <StatRow label="Total Questions" value={stats.totalQuestions} isLast />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-[#005eb8] dark:text-blue-400 font-bold text-xs uppercase tracking-widest">Test Count</h3>
            <div className="bg-card rounded-lg p-1 border border-border">
              <StatRow label="Tests Created" value={stats.testsCreated} />
              <StatRow label="Tests Completed" value={stats.testsCompleted} />
              <StatRow label="Suspended Tests" value={stats.suspendedTests} isLast />
            </div>
          </div>
        </div>

        {/* Row 3: Cognition & Readiness */}
        <div className="pt-12 border-t border-border">
          <h2 className="text-2xl font-bold mb-8 text-foreground">Cognitive Intelligence & Readiness</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Readiness Meter */}
            <div className="lg:col-span-4 bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6">Exam Readiness</span>
                <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="88" stroke="#f1f5f9" strokeWidth="16" fill="none" className="dark:stroke-zinc-800" />
                        <circle
                            cx="96" cy="96" r="88"
                            stroke="url(#passGrad)"
                            strokeWidth="16"
                            fill="none"
                            strokeDasharray={552}
                            strokeDashoffset={552 - (552 * stats.readinessScore / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                            <linearGradient id="passGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100">{stats.readinessScore}%</span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Pass Probability</span>
                    </div>
                </div>
                <p className="text-zinc-500 text-xs text-center mt-6 italic">Derived from accuracy, unique exposure, and performance stability.</p>
            </div>

            {/* Cognitive Indices */}
            <div className="lg:col-span-4 flex flex-col gap-4">
                <CognitionCard 
                    title="Overthinking Index" 
                    value={stats.overthinkingIndex} 
                    label="Right -> Wrong Changes"
                    color="text-amber-500"
                    desc="Frequent changes often indicate a lack of conceptual confidence."
                />
                <CognitionCard 
                    title="Impulsivity Index" 
                    value={stats.impulsivityIndex} 
                    label="Fast Incorrect Answers"
                    color="text-red-500"
                    desc="High impulsivity leads to &apos;silly mistakes&apos; on easy questions."
                />
                <CognitionCard 
                    title="Fatigue Factor" 
                    value={`${stats.fatigueFactor}%`} 
                    label="Late-Block Performance Decay"
                    color="text-purple-500"
                    desc="Measures your ability to maintain focus throughout long blocks."
                />
            </div>

            {/* Personalized Coaching */}
            <div className="lg:col-span-4 bg-[#1e1e24] dark:bg-zinc-900/50 rounded-2xl p-8 border border-zinc-700/30 text-white">
                <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Info size={14} /> Cognitive Coaching
                </h3>
                <div className="space-y-6">
                    {stats.overthinkingIndex > 2 && (
                        <div className="space-y-1">
                            <span className="text-amber-400 text-sm font-bold">Trust your first instinct.</span>
                            <p className="text-zinc-400 text-xs leading-relaxed">You are frequently changing correct answers to incorrect ones. Stick to your first choice unless you find definitive evidence otherwise.</p>
                        </div>
                    )}
                    {stats.impulsivityIndex > 2 && (
                        <div className="space-y-1">
                            <span className="text-red-400 text-sm font-bold">Read the full stem.</span>
                            <p className="text-zinc-400 text-xs leading-relaxed">Your fast error rate is high. Focus on identifying the &apos;crucial finding&apos; in the stem before glancing at the options.</p>
                        </div>
                    )}
                    {stats.fatigueFactor > 15 && (
                        <div className="space-y-1">
                            <span className="text-purple-400 text-sm font-bold">Build endurance.</span>
                            <p className="text-zinc-400 text-xs leading-relaxed">Your performance drops significantly in the second half of tests. Practice longer blocks to build assessment stamina.</p>
                        </div>
                    )}
                    {stats.readinessScore > 75 ? (
                        <div className="pt-4 border-t border-zinc-700/50">
                            <span className="text-emerald-400 text-sm font-bold">Target Exam Readiness Reached.</span>
                            <p className="text-zinc-400 text-xs leading-relaxed">Your stability and accuracy suggest a high probability of success. Focus on maintaining current standards.</p>
                        </div>
                    ) : (
                        <div className="pt-4 border-t border-zinc-700/50">
                            <span className="text-blue-400 text-sm font-bold">Expansion Required.</span>
                            <p className="text-zinc-400 text-xs leading-relaxed">Continue utilizing the QBank to increase unique question exposure and stabilize your accuracy.</p>
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function CognitionCard({ title, value, label, color, desc }) {
    return (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</span>
                <span className={`text-xl font-black ${color}`}>{value}</span>
            </div>
            <span className="text-xs font-bold text-foreground block mb-1">{label}</span>
            <p className="text-[11px] text-zinc-500 leading-tight">{desc}</p>
        </div>
    );
}

function StatRow({ label, value, isLast }) {
  return (
    <div className={`flex justify-between items-center p-3 ${!isLast ? 'border-b border-border' : ''}`}>
      <span className="text-sm text-zinc-700 dark:text-zinc-100 font-bold">{label}</span>
      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 bg-accent/30 dark:bg-zinc-800 px-4 py-1.5 rounded-full border border-border shadow-sm min-w-[4rem] text-center">
        {value}
      </span>
    </div>
  );
}
