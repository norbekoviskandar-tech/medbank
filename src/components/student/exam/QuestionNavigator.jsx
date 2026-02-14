"use client";

import React from "react";
import { Flag } from "lucide-react";
import { useExam } from "@/context/ExamContext";

export default function QuestionNavigator() {
  const { 
    questions, currentIndex, setCurrentIndex, answers, markedQuestions, 
    showQuestionList, isReviewMode, mode, setSelectedAnswer, setIsSubmitted,
    tutorReveals
  } = useExam();

  return (
    <aside
      className={`bg-[#002b5c] border-r border-[#16368a] transition-all duration-300 overflow-y-auto no-scrollbar flex flex-col ${showQuestionList ? 'w-[64px]' : 'w-0'}`}
    >
      {questions.map((_, idx) => {
        const isCurrent = idx === currentIndex;
        const qItem = questions[idx];
        if (!qItem) return null;
        const qId = qItem.id;
        const userAnswer = answers[qId];
        const hasAnswer = !!userAnswer;
        const isMarked = markedQuestions.has(qId);

        const showResult = isReviewMode || (mode === "tutor" && hasAnswer);
        const isCorrect = showResult && hasAnswer && userAnswer === qItem.correct;

        return (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              const previousAnswer = answers[questions[idx]?.id] || null;
              setSelectedAnswer(previousAnswer);
              setIsSubmitted(isReviewMode || (mode === "tutor" && !!previousAnswer) || tutorReveals.has(questions[idx]?.id));
            }}
            className={`w-full py-4 flex flex-col items-center justify-center transition-all border-l-4 relative ${isCurrent
              ? 'bg-blue-400/10 border-amber-400'
              : 'border-transparent hover:bg-white/5 hover:text-white'
              }`}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className={`text-[15px] font-black tracking-tighter ${isCurrent ? 'text-amber-400' : 'text-white/40'}`}>
                {idx + 1}
              </span>
              <div className="flex gap-1 items-center h-1.5">
                {showResult ? (
                  hasAnswer && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isCorrect ? 'bg-emerald-400' : 'bg-red-500'}`} title={isCorrect ? "Correct" : "Incorrect"} />
                  )
                ) : (
                  hasAnswer && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Answered" />
                  )
                )}
                {isMarked && <Flag size={9} className="text-orange-500 fill-orange-500" title="Marked" />}
              </div>
            </div>
          </button>
        );
      })}
    </aside>
  );
}
