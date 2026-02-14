"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { useExam } from "@/context/ExamContext";

export default function AnswerOptions() {
  const { 
    currentQuestion: q, selectedAnswer, handleSelectAnswer, 
    strikeouts, toggleStrikeout, isReviewMode, mode, isSubmitted, lockedAnswers 
  } = useExam();

  if (!q) return null;

  return (
    <div className="space-y-4">
      {q.choices.map((choice, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSelected = selectedAnswer === letter;
        const isCorrect = q.correct === letter;
        const isStruck = strikeouts[q.id]?.has(letter);
        const isLocked = !!lockedAnswers[q.id];
        const showFeedback = isReviewMode || (mode === "tutor" && isSubmitted);

        let choiceStyle = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50";
        let radioStyle = "border-zinc-400 dark:border-zinc-600 border-[3px]";

        if (isLocked) choiceStyle = "opacity-80 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20 cursor-not-allowed";
        if (isSelected) radioStyle = "border-[#0072bc] bg-[#0072bc]";

        if (showFeedback) {
          choiceStyle = "border-transparent bg-transparent pointer-events-none";
          if (isSelected) radioStyle = "border-[#0072bc] bg-[#0072bc]";
          else if (isCorrect) radioStyle = "border-zinc-300 border-[3px]";
          else radioStyle = "border-zinc-200 border-[2px] opacity-40";
        }

        const dist = q.choiceDistribution || {};
        const totalPicks = Object.values(dist).reduce((a, b) => a + b, 0);
        const pickCount = dist[letter] || 0;
        const percentage = totalPicks > 0 ? Math.round((pickCount / totalPicks) * 100) : 0;

        return (
          <div 
            key={i}
            className={`flex items-start gap-2 rounded-md transition-all border ${choiceStyle} relative group overflow-hidden`}
          >
            {/* Visual Strike overlay */}
            {isStruck && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute w-[120%] h-[1.5px] bg-zinc-300 dark:bg-zinc-700 top-1/2 left-0 -translate-y-1/2 rotate-[2deg] opacity-60" />
              </div>
            )}

            {showFeedback && (
              <div className="w-6 shrink-0 flex items-center justify-center mt-1.5">
                {isCorrect && <Check size={20} className="text-green-500 stroke-[4px]" />}
                {isSelected && !isCorrect && <X size={20} className="text-red-500 stroke-[4px]" />}
              </div>
            )}

            <div className={`flex flex-1 items-start gap-4 p-4 py-2.5 ${isStruck ? 'opacity-40 grayscale-[0.5]' : ''}`}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAnswer(q.id, letter);
                }}
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${radioStyle}`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
              </div>
              <div
                className="flex-1 flex flex-col gap-2 cursor-pointer relative"
                onClick={() => toggleStrikeout(q.id, letter)}
              >
                <span className={`text-[15px] select-none ${isStruck ? 'text-zinc-400 dark:text-zinc-600' : isSelected ? "font-bold text-zinc-900 dark:text-[#f8fafc]" : "font-medium text-zinc-700 dark:text-zinc-300"}`}>
                  {letter}. {choice.text}
                  {showFeedback && (
                    <span className="ml-2 text-zinc-400 dark:text-zinc-500 font-normal text-[14px]">
                      ({percentage}%)
                    </span>
                  )}
                </span>
                {choice.image?.data && (
                  <img src={choice.image.data} alt={`choice-${letter}`} className="max-w-xs rounded border mt-2" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
