"use client";

import React from "react";
import { useExam } from "@/context/ExamContext";

export default function QuestionViewer() {
  const { currentQuestion: q } = useExam();

  if (!q) return null;

  return (
    <div className="w-full space-y-6">
      <div className="text-[18px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap">
        {q.stem}
        {q.stemImage?.data && (
          <div className="mt-8 flex justify-center">
            <img 
              src={q.stemImage.data} 
              alt="stem" 
              className="max-w-full rounded border-2 border-zinc-100 shadow-sm" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
