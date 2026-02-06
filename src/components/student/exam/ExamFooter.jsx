"use client";

import React from "react";
import { Power, Pause, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useExam } from "@/context/ExamContext";

export default function ExamFooter() {
  const { 
    isReviewMode, handleEndBlock, handleSuspend, handlePrevious, 
    handleNext, currentIndex, totalQuestions, mode, isSubmitted 
  } = useExam();

  return (
    <footer className="bg-[#002b5c] text-white h-[45px] flex items-center px-0 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] z-50 border-t border-white/10">
      <div className="flex items-center h-full">
        <button
          onClick={() => handleEndBlock()}
          className="flex items-center gap-2 px-4 h-full hover:bg-white/10 transition-colors group"
        >
          <Power size={18} className="text-white/70 group-hover:text-white" />
          <span className="text-[13px] font-medium leading-none">{isReviewMode ? "Exit" : "End"}</span>
        </button>

        <div className="w-px h-6 bg-white/20" />

        <button
          onClick={() => handleSuspend()}
          className="flex items-center gap-2 px-4 h-full hover:bg-white/10 transition-colors group"
        >
          <Pause size={18} className="text-white/70 group-hover:text-white" />
          <span className="text-[13px] font-medium leading-none">Suspend</span>
        </button>
      </div>

      <div className="flex-1 flex justify-center h-full">
        <button className="flex items-center gap-2 px-4 h-full hover:bg-white/10 transition-colors group">
          <MessageSquare size={16} className="text-white/70 group-hover:text-white" />
          <span className="text-[13px] font-medium leading-none">Feedback</span>
        </button>
      </div>

      <div className="flex items-center h-full">
        <button 
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 h-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors group border-l border-white/10"
        >
          <ChevronLeft size={20} />
          <span className="text-[13px] font-medium leading-none">Previous</span>
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1 && (mode === "tutor" || isReviewMode)}
          className="flex items-center gap-2 px-6 h-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors group border-l border-white/10"
        >
          <span className="text-[13px] font-medium leading-none">Next</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </footer>
  );
}
