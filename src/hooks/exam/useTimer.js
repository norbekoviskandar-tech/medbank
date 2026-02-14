"use client";

import { useEffect, useCallback } from "react";

export function useTimer({
  isReviewMode,
  mode,
  isSubmitted,
  questions,
  currentIndex,
  totalQuestions,
  elapsedTime,
  setElapsedTime,
  setQuestionDurations,
  modalShow,
  isEnding,
  handleAutoEnd
}) {
  
  // Timer interval
  useEffect(() => {
    if (isReviewMode || isEnding) return;
    if (mode === "tutor" && isSubmitted) return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);

      const currentQId = questions[currentIndex]?.id;
      if (currentQId) {
        setQuestionDurations(prev => ({
          ...prev,
          [currentQId]: (prev[currentQId] || 0) + 1
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isReviewMode, mode, isSubmitted, questions, currentIndex, setElapsedTime, setQuestionDurations, isEnding]);

  // Auto-end for Timed Mode
  useEffect(() => {
    if (mode === "timed" && !isReviewMode && totalQuestions > 0 && !modalShow && !isEnding) {
      const timeLimit = totalQuestions * 90;
      if (elapsedTime >= timeLimit) {
        handleAutoEnd(true);
      }
    }
  }, [elapsedTime, mode, isReviewMode, totalQuestions, modalShow, isEnding, handleAutoEnd]);

  const formatTime = useCallback((seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return { formatTime };
}
