"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllQuestions, getQuestionById, updateQuestionStats } from "@/services/question.service";
import { updateUserQuestion } from "@/services/user.service";
import { saveTest, getTestById } from "@/services/test.service";

export function useExamEngine() {
  const router = useRouter();
  
  // --- STATE ---
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mode, setMode] = useState("tutor");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [lockedAnswers, setLockedAnswers] = useState({});
  const [firstAnswers, setFirstAnswers] = useState({});
  const [sessionTestId, setSessionTestId] = useState(null);
  const [questionDurations, setQuestionDurations] = useState({});
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [strikeouts, setStrikeouts] = useState({});
  const [modal, setModal] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [isEnding, setIsEnding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- ENGINE EXTENSIONS (Audit & State) ---
  const [sessionLogs, setSessionLogs] = useState([]);
  const [answerHistory, setAnswerHistory] = useState({});
  const [tutorReveals, setTutorReveals] = useState(new Set());
  const [lastSyncHash, setLastSyncHash] = useState("");
  const syncTimerRef = useRef(null);

  // --- DERIVED ---
  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;

  // --- INITIAL LOAD ---
  useEffect(() => {
    const testData = JSON.parse(localStorage.getItem("medbank_current_test"));
    if (!testData || !testData.questions) {
      router.push("/student/qbank/create-test");
      return;
    }

    const testMode = testData.mode || "tutor";
    setMode(testMode);
    setIsReviewMode(!!testData.isReview);
    
    async function fetchQuestions() {
      setIsLoading(true);
      try {
        // NEW: Assembly Snapshot Engine
        // Try to use the snapshotted 'questions' list first (guarantees immutability)
        let ordered = [];
        if (typeof testData.questions === 'string') {
          try {
            const parsed = JSON.parse(testData.questions);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
              ordered = parsed;
            }
          } catch(e) {}
        }
        
        // Fallback to ID-based loading if snapshot is missing or stale
        if (ordered.length === 0) {
          const all = await getAllQuestions();
          const rawIds = testData.questions || [];
          const selectedIds = rawIds.map(id => (typeof id === 'object' && id !== null) ? String(id.id) : String(id));
          const selected = all.filter(q => selectedIds.includes(String(q.id)));
          ordered = selectedIds.map(id => selected.find(q => String(q.id) === id)).filter(Boolean);
        }
        
        if (testData.sessionState) {
          try {
            const ss = typeof testData.sessionState === 'string' ? JSON.parse(testData.sessionState) : testData.sessionState;
            setAnswerHistory(ss.answerHistory || {});
            setSessionLogs(ss.logs || []);
            setTutorReveals(new Set(ss.tutorReveals || []));
            if (ss.strikeouts) {
                const restoredStrikes = {};
                Object.entries(ss.strikeouts).forEach(([qid, letters]) => {
                    restoredStrikes[qid] = new Set(letters);
                });
                setStrikeouts(restoredStrikes);
            }
          } catch(e) { console.warn("Failed to restore sessionState", e); }
        }

        setQuestions(ordered);

        const sourceAnswers = testData.answers || testData.resumeData?.answers || {};
        const savedFirstAnswers = testData.firstAnswers || testData.resumeData?.firstAnswers || {};
        setFirstAnswers(savedFirstAnswers);
        
        const savedIndex = testData.currentIndex ?? testData.resumeData?.currentIndex ?? 0;
        let savedTime = testData.elapsedTime ?? testData.resumeData?.elapsedTime ?? 0;
        const savedDurations = testData.questionDurations || testData.resumeData?.questionDurations || {};
        setQuestionDurations(savedDurations);

        if (testMode === "timed" && testData.resumeData?.isOmittedResume) {
          const timeLimit = selectedIds.length * 90;
          if (savedTime >= timeLimit) {
            const omittedCount = selectedIds.filter(id => !sourceAnswers[id]).length;
            savedTime = Math.max(0, timeLimit - (omittedCount * 60));
          }
        }

        const savedMarked = testData.markedIds ?? testData.resumeData?.markedIds ?? [];
        setAnswers(sourceAnswers);

        // Lock logic
        if (testData.isReview) {
          setLockedAnswers(sourceAnswers);
        } else if (testMode.toLowerCase() === 'tutor') {
          setLockedAnswers(sourceAnswers);
        } else if (testData.resumeData?.isOmittedResume && !testData.resumeData?.isSuspended) {
          setLockedAnswers(sourceAnswers);
        } else {
          setLockedAnswers({});
        }

        let targetIndex = savedIndex;
        if (testData.resumeData?.isOmittedResume) {
          const firstOmittedIdx = ordered.findIndex(qObj => !sourceAnswers[qObj.id]);
          if (firstOmittedIdx !== -1) targetIndex = firstOmittedIdx;
        }

        setCurrentIndex(targetIndex);
        setElapsedTime(savedTime);
        setMarkedQuestions(new Set(savedMarked));

        const currentUser = localStorage.getItem("medbank_user");
        const persistentId = String(testData.testId || testData.resumeData?.originalTestId || Date.now());
        setSessionTestId(persistentId);

        const activeQuestion = ordered[targetIndex];
        if (activeQuestion) {
          const currentAnswer = sourceAnswers[activeQuestion.id];
          if (testData.isReview || (testMode.toLowerCase() === 'tutor' && currentAnswer)) {
            setSelectedAnswer(currentAnswer);
            setIsSubmitted(true);
          } else if (currentAnswer) {
            setSelectedAnswer(currentAnswer);
            setIsSubmitted(false);
          }
        }
      } catch (err) {
        console.error("Exam load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, [router]);

  // --- AUDIT LOG HELPER ---
  const logAction = useCallback((action, metadata = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        offset: elapsedTime,
        questionId: currentQuestion?.id,
        index: currentIndex,
        action,
        ...metadata
    };
    setSessionLogs(prev => [...prev, entry]);
  }, [elapsedTime, currentQuestion?.id, currentIndex]);

  // --- PERSISTENCE & SYNC ---
  useEffect(() => {
    if (questions.length === 0 || isReviewMode || isEnding) return;
    const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
    const activeTestId = sessionTestId || String(currentTestData.testId || "");
    if (!activeTestId) return;

    // Convert Sets to Arrays for JSON serialization
    const serializableStrikes = {};
    Object.entries(strikeouts).forEach(([qid, set]) => {
        serializableStrikes[qid] = Array.from(set);
    });

    const sessionState = {
        answerHistory,
        strikeouts: serializableStrikes,
        tutorReveals: Array.from(tutorReveals),
        logs: sessionLogs
    };

    const updatedTestData = {
      ...currentTestData,
      testId: activeTestId,
      answers,
      currentIndex,
      elapsedTime,
      markedIds: Array.from(markedQuestions),
      firstAnswers,
      questionDurations,
      sessionState
    };
    
    const stateString = JSON.stringify(updatedTestData);
    localStorage.setItem("medbank_current_test", stateString);

    // Silent Sync Logic (Authoritative)
    if (!syncTimerRef.current) {
        syncTimerRef.current = setInterval(async () => {
            const currentHash = localStorage.getItem("medbank_current_test");
            if (currentHash !== lastSyncHash) {
                try {
                    const data = JSON.parse(currentHash);
                    await saveTest(data);
                    setLastSyncHash(currentHash);
                    console.log("Exam Engine: Silent sync complete.");
                } catch(e) { console.error("Silent sync failed", e); }
            }
        }, 10000);
    }

    return () => {
        if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
        }
    };
  }, [answers, currentIndex, elapsedTime, markedQuestions, questions.length, isReviewMode, questionDurations, sessionTestId, firstAnswers, isEnding, answerHistory, strikeouts, tutorReveals, sessionLogs, lastSyncHash]);

  // --- ACTIONS ---
  const handleEndBlock = useCallback((isAuto = false) => {
    const processSubmission = async () => {
      setIsEnding(true);
      if (isReviewMode) {
        router.push("/student/qbank/test-summary");
        return;
      }

      const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
      const activeTestId = sessionTestId || String(currentTestData.testId || "");
      
      const results = {
        testId: String(activeTestId || Date.now()),
        testNumber: currentTestData.testNumber,
        date: currentTestData.date || new Date().toISOString(),
        mode,
        pool: currentTestData.pool || "All Questions",
        packageId: currentTestData.packageId || null,
        questions: questions.map(quest => ({
          id: quest?.id,
          correct: quest?.correct,
          userAnswer: answers[quest?.id] || null,
          subject: quest?.subject,
          system: quest?.system,
          timeSpent: questionDurations[quest?.id] || 0
        })),
        answers,
        firstAnswers,
        elapsedTime,
        markedIds: Array.from(markedQuestions),
        isSuspended: false
      };

      const currentUser = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;

      await Promise.all(results.questions.map(async (item) => {
        try {
          const isCorrect = item.userAnswer === item.correct;
          const choiceDistUpdate = {};
          if (item.userAnswer) choiceDistUpdate[item.userAnswer] = 1;

          const qHistory = answerHistory[item.id] || [];
          const volatility = qHistory.length; 
          const strikeCount = (strikeouts[item.id]?.size) || 0;
          const isMarked = markedQuestions.has(item.id) ? 1 : 0;

          await updateQuestionStats(item.id, {
            globalAttempts: 1,
            globalCorrect: isCorrect ? 1 : 0,
            choiceDistribution: choiceDistUpdate,
            timeSpent: item.timeSpent || 0,
            volatility,
            strikes: strikeCount,
            marks: isMarked
          });

          const isNowCorrect = item.userAnswer === item.correct;
          const status = !item.userAnswer ? 'omitted' : (isNowCorrect ? 'correct' : 'incorrect');

          if (currentUser) {
            await updateUserQuestion(currentUser, item.id, results.packageId, {
              userAnswer: item.userAnswer,
              status,
              isMarked,
              timeSpent: item.timeSpent || 0,
              testId: results.testId // NEW: Pass testId for granular logging
            });
          }
        } catch (err) { console.error("Stat update error:", item.id, err); }
      }));

      await saveTest(results);
      localStorage.setItem("medbank_last_test_id", results.testId);
      localStorage.setItem("medbank_current_test", JSON.stringify({ ...results, isReview: false }));
      router.push("/student/qbank/test-summary");
    };

    if (isAuto) {
      processSubmission();
    } else {
      let msg, title, type;
      if (isReviewMode) {
        title = "End Review Session";
        msg = "Are you sure you want to exit this review session?";
        type = "info";
      } else {
        const unansweredCount = questions.length - Object.keys(answers).length;
        if (unansweredCount > 0) {
          title = "End Test Block Permanently";
          msg = `Warning: You still have ${unansweredCount} unanswered questions. If you end this block now, it will be marked as finished. You can resume the omitted questions later from your history, but your current answers will be saved permanently and cannot be changed.`;
          type = "danger";
        } else {
          title = "End Test Session";
          msg = "Great job finishing all questions! Are you sure you want to end this block? This will calculate your final score and record the results permanently.";
          type = "confirm";
        }
      }

      setModal({
        show: true,
        title: title,
        message: msg,
        type: type,
        confirmText: isReviewMode ? "End Review" : "End Block Permanently",
        onConfirm: processSubmission,
      });
    }
  }, [sessionTestId, questions, answers, mode, elapsedTime, markedQuestions, isReviewMode, firstAnswers, questionDurations, router, logAction, strikeouts, answerHistory]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      const nextIdx = currentIndex + 1;
      logAction("navigate_next", { from: currentIndex, to: nextIdx });
      setCurrentIndex(nextIdx);
      const nextAnswer = answers[questions[nextIdx]?.id] || null;
      setSelectedAnswer(nextAnswer);
      setIsSubmitted(isReviewMode || (mode === "tutor" && !!nextAnswer) || tutorReveals.has(questions[nextIdx]?.id));
    } else if (!isReviewMode) {
      handleEndBlock();
    }
  }, [currentIndex, totalQuestions, questions, answers, isReviewMode, mode, logAction, tutorReveals, handleEndBlock]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      logAction("navigate_previous", { from: currentIndex, to: prevIdx });
      setCurrentIndex(prevIdx);
      const prevAnswer = answers[questions[prevIdx]?.id] || null;
      setSelectedAnswer(prevAnswer);
      setIsSubmitted(isReviewMode || (mode === "tutor" && !!prevAnswer) || tutorReveals.has(questions[prevIdx]?.id));
    }
  }, [currentIndex, questions, answers, isReviewMode, mode, logAction, tutorReveals]);

  const handleSubmit = useCallback(() => {
    if (isReviewMode || !selectedAnswer || !currentQuestion) return;
    if (mode === "tutor") {
      setIsSubmitted(true);
      setTutorReveals(prev => new Set([...prev, currentQuestion.id]));
      logAction("tutor_reveal", { choice: selectedAnswer });
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
    } else {
      handleNext();
    }
  }, [currentQuestion, isReviewMode, mode, selectedAnswer, logAction, handleNext]);

  const toggleStrikeout = useCallback((qId, letter) => {
    if (isReviewMode || isSubmitted || !qId) return;
    setStrikeouts(prev => {
      const qStrikeouts = new Set(prev[qId] || []);
      if (qStrikeouts.has(letter)) {
        qStrikeouts.delete(letter);
        logAction("unstrike_option", { questionId: qId, choice: letter });
      } else {
        qStrikeouts.add(letter);
        logAction("strike_option", { questionId: qId, choice: letter });
        if (answers[qId] === letter) {
          setAnswers(prevAns => {
            const next = { ...prevAns };
            delete next[qId];
            return next;
          });
          if (qId === currentQuestion?.id) setSelectedAnswer(null);
        }
      }
      return { ...prev, [qId]: qStrikeouts };
    });
  }, [isReviewMode, isSubmitted, answers, currentQuestion?.id, logAction]);

  const handleSelectAnswer = useCallback((qId, letter) => {
    if (isReviewMode || isSubmitted || !qId || lockedAnswers[qId]) return;

    if (!firstAnswers[qId]) {
      setFirstAnswers(prev => ({ ...prev, [qId]: letter }));
    }

    const currentLetter = answers[qId];

    if (currentLetter === letter) {
      // Deselect
      setAnswers(prev => {
        const newState = { ...prev };
        delete newState[qId];
        return newState;
      });
      logAction("deselect_answer", { questionId: qId, choice: letter });
      if (qId === currentQuestion?.id) setSelectedAnswer(null);
    } else {
      // Select
      setAnswers(prev => ({ ...prev, [qId]: letter }));
      logAction("select_answer", { questionId: qId, choice: letter });
      
      if (qId === currentQuestion?.id) setSelectedAnswer(letter);

      // Track Answer History
      setAnswerHistory(prev => {
        const qHistory = prev[qId] || [];
        return {
            ...prev,
            [qId]: [...qHistory, { choice: letter, timestamp: new Date().toISOString(), offset: elapsedTime }]
        };
      });

      if (strikeouts[qId]?.has(letter)) {
        toggleStrikeout(qId, letter);
      }
    }
  }, [answers, firstAnswers, isReviewMode, isSubmitted, lockedAnswers, logAction, currentQuestion?.id, elapsedTime, strikeouts, toggleStrikeout]);

  const toggleMark = useCallback(async () => {
    if (!currentQuestion) return;
    const newMarked = new Set(markedQuestions);
    const isNowMarked = !newMarked.has(currentQuestion.id);

    if (newMarked.has(currentQuestion.id)) newMarked.delete(currentQuestion.id);
    else newMarked.add(currentQuestion.id);
    setMarkedQuestions(newMarked);

    try {
      const currentUser = localStorage.getItem("medbank_user");
      const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
      const packageId = currentTestData.packageId;

      if (currentUser && packageId) {
        await updateUserQuestion(currentUser, currentQuestion.id, packageId, {
          isMarked: isNowMarked,
          testId: sessionTestId || String(currentTestData.testId || "")
        });
      }
    } catch (err) {
      console.error("Flag persist error:", err);
    }
  }, [currentQuestion, markedQuestions]);

  const handleSuspend = useCallback((showConfirm = true) => {
    if (isReviewMode) {
      router.push("/student/qbank/test-summary");
      return;
    }

    const executeSuspend = async () => {
      setIsEnding(true);
      logAction("suspend_session");
      const testData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
      await saveTest(testData); 
      localStorage.removeItem("medbank_current_test");
      router.push("/student/qbank");
    };

    if (showConfirm) {
      setModal({
        show: true,
        title: "Suspend Test session",
        message: "Are you sure you want to suspend this test? You will be able to resume this session exactly where you left off from your Previous Tests history.",
        onConfirm: executeSuspend
      });
    } else {
      executeSuspend();
    }
  }, [isReviewMode, router, logAction]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    if (isReviewMode || isEnding || isLoading || !currentQuestion) return;

    const handleKeyDown = (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || modal.show) return;

        const key = e.key.toUpperCase();
        
        if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
            handleSelectAnswer(currentQuestion.id, key);
        }
        else if (key === 'M') {
            toggleMark();
        }
        else if (e.key === 'ArrowRight') {
            handleNext();
        }
        else if (e.key === 'ArrowLeft') {
            handlePrevious();
        }
        else if (e.key === 'Enter' && selectedAnswer && !isSubmitted) {
            handleSubmit();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewMode, isEnding, isLoading, currentQuestion, handleSelectAnswer, toggleMark, handleNext, handlePrevious, handleSubmit, selectedAnswer, isSubmitted, modal.show]);

  return {
    // State
    questions, currentIndex, selectedAnswer, answers, isSubmitted, mode, isReviewMode,
    elapsedTime, markedQuestions, lockedAnswers, firstAnswers, sessionTestId,
    questionDurations, showQuestionList, strikeouts, modal, isEnding, isLoading,
    answerHistory, sessionLogs, tutorReveals,
    // Derived
    currentQuestion, totalQuestions,
    // setters
    setCurrentIndex, setSelectedAnswer, setAnswers, setIsSubmitted, setElapsedTime, setQuestionDurations, setShowQuestionList, setModal,
    // Helpers
    handleSelectAnswer, toggleStrikeout, handleSubmit, handleNext, handlePrevious,
    toggleMark, handleSuspend, handleEndBlock
  };
}
