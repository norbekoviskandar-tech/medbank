"use client";

import React from "react";
import { BarChart2, Clock } from "lucide-react";
import { useExam } from "@/context/ExamContext";

export default function RationalesPanel() {
  const { 
    currentQuestion: q, isReviewMode, mode, isSubmitted, 
    selectedAnswer, questionDurations, answerHistory
  } = useExam();

  if (!(isReviewMode || (mode === "tutor" && isSubmitted)) || !q) return null;

  const dist = q.choiceDistribution || {};
  const totalPicks = Object.values(dist).reduce((a, b) => a + b, 0);
  const correctPicks = dist[q.correct] || 0;
  const percentageCorrect = totalPicks > 0 ? Math.round((correctPicks / totalPicks) * 100) : 0;

  return (
    <div className="p-8 lg:p-10 bg-white dark:bg-zinc-900/50 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
      <div className="space-y-8">
        <div className="max-w-none">
          <div className={`flex flex-wrap items-center gap-6 p-6 rounded-lg mb-8 bg-[#1e1e24] dark:bg-zinc-800/50 border-l-[6px] transition-all ${selectedAnswer === q.correct ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex flex-col min-w-[100px]">
              <span className={`text-[20px] font-bold ${selectedAnswer === q.correct ? 'text-green-500' : 'text-red-500'}`}>
                {!selectedAnswer ? 'Omitted' : (selectedAnswer === q.correct ? 'Correct' : 'Incorrect')}
              </span>
            </div>
            
            <div className="flex items-center gap-3 border-l border-zinc-700/50 pl-6 h-10">
              <BarChart2 size={24} className="text-zinc-400 opacity-60" strokeWidth={1.5} />
              <div className="flex flex-col">
                <span className="text-zinc-100 dark:text-zinc-200 font-bold leading-none text-lg">
                  {percentageCorrect}%
                </span>
                <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mt-1">Peer Average</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-zinc-700/50 pl-6 h-10">
              <Clock size={24} className="text-zinc-400 opacity-60" strokeWidth={1.5} />
              <div className="flex flex-col">
                <span className="text-zinc-100 dark:text-zinc-200 font-bold leading-none text-lg">
                  {questionDurations?.[q.id] || 0}s
                </span>
                <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mt-1">Your Time</span>
              </div>
            </div>

            {/* FORENSIC: Volatility & Second-Guessing */}
            {answerHistory?.[q.id]?.length > 1 && (
              <div className="flex items-center gap-3 border-l border-zinc-700/50 pl-6 h-10">
                <div className="flex flex-col">
                  <span className="text-amber-400 font-bold leading-none text-lg">
                    {answerHistory[q.id].length} changes
                  </span>
                  <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mt-1">Volatility</span>
                </div>
              </div>
            )}

            {(() => {
              const history = answerHistory?.[q.id] || [];
              if (history.length < 2) return null;
              const firstChoice = history[0].choice;
              const lastChoice = history[history.length - 1].choice;
              
              if (firstChoice === q.correct && lastChoice !== q.correct) {
                return (
                  <div className="flex items-center gap-3 border-l border-red-500/30 pl-6 h-10">
                    <span className="text-red-400 font-bold text-[12px] uppercase tracking-tighter leading-tight">
                      Second-Guessing:<br/>Right → Wrong
                    </span>
                  </div>
                );
              }
              if (firstChoice !== q.correct && lastChoice === q.correct) {
                return (
                  <div className="flex items-center gap-3 border-l border-green-500/30 pl-6 h-10">
                    <span className="text-green-400 font-bold text-[12px] uppercase tracking-tighter leading-tight">
                      Good Recovery:<br/>Wrong → Right
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          
          <div className="text-[17px] leading-relaxed text-zinc-800 dark:text-zinc-200 space-y-4">
            {q.explanationCorrect?.split('\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>

        {q.explanationWrong && (
          <div className="pt-8 border-t border-zinc-100">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">Incorrect Explanations</h4>
            <div className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 italic space-y-3">
              {q.explanationWrong.split('\n').map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </div>
        )}

        {q.summary && (
          <div className="mt-8 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#002b5c]/50 dark:text-blue-400/30 block mb-3">Key Summary</span>
            <p className="font-bold text-[16px] text-zinc-900 dark:text-zinc-200 italic">&quot;{q.summary}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
