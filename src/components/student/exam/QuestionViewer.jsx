"use client";

import React, { memo } from "react";
import Image from "next/image";
import { useExam } from "@/context/ExamContext";

function QuestionViewer() {
  const { currentQuestion: q } = useExam();

  if (!q) return null;

  return (
    <div className="w-full space-y-6">
      <div className="text-[18px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap">
        {q.stem}
        {q.stemImage?.data && (
          <div className="mt-8 flex justify-center">
            <Image 
              src={q.stemImage.data} 
              alt="stem" 
              width={400} height={300}
              loading="lazy"
              className="max-w-full rounded border-2 border-zinc-100 shadow-sm" 
            />
          </div>
        )}
      </div>

      {/* Rationale / Explanation Section */}
      {(q.isReviewMode || (q.mode === 'tutor' && q.isSubmitted)) && (
        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
          {q.explanationCorrect && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                Correct Rationale
              </h3>
              <div className="text-[16px] leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {q.explanationCorrect}
              </div>
            </div>
          )}

          {q.explanationWrong && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Incorrect Rationale
              </h3>
              <div className="text-[16px] leading-relaxed text-zinc-600 dark:text-zinc-400 italic whitespace-pre-wrap">
                {q.explanationWrong}
              </div>
            </div>
          )}

          {q.summary && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                Summary
              </h3>
              <div className="text-[16px] font-medium text-zinc-900 dark:text-zinc-100 italic">
                {q.summary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(QuestionViewer);
