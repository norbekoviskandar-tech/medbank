"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllQuestions } from "@/services/question.service";
import { saveTest, getTestById, updateAttemptAnswer, updateAttemptFlag, snapshotAttempt, finishAttempt } from "@/services/test.service";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, Flag, ChevronLeft, ChevronRight, Maximize2, 
  HelpCircle, FlaskConical, StickyNote, Calculator, 
  Contrast, ZoomIn, Settings, Layers, 
  MessageSquare, PauseCircle, LogOut, AlertTriangle,
  Power, Pause, Check, X, BarChart2, Clock
 } from "lucide-react";

export default function TakeTestPage() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: selection }
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [mode, setMode] = useState("tutor");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [originalTestId, setOriginalTestId] = useState(null);
  const [lockedAnswers, setLockedAnswers] = useState({}); // To identify answers that cannot be changed
  const [firstAnswers, setFirstAnswers] = useState({}); // To track first choice for change analysis
  const [sessionTestId, setSessionTestId] = useState(null);
  const [questionDurations, setQuestionDurations] = useState({}); // { questionId: seconds }
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [strikeouts, setStrikeouts] = useState({}); // { questionId: Set of letters }
  const [modal, setModal] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [isEnding, setIsEnding] = useState(false);
  const [testAttemptId, setTestAttemptId] = useState(null); // NEW: Track strict attempt ID
  const router = useRouter();
  const handleEndBlockRef = useRef(null);

  // Load test configuration
  useEffect(() => {
    const testData = JSON.parse(localStorage.getItem("medbank_current_test"));
    if (!testData || !testData.questions) {
      router.push("/student/qbank/create-test");
      return;
    }

    const testMode = testData.mode || "tutor";
    setMode(testMode);
    setIsReviewMode(!!testData.isReview);
    // NEW: Capture attempt ID
    setTestAttemptId(testData.testAttemptId);
    
    async function fetchQuestions() {
      const effectivePackageId = String(testData.packageId || localStorage.getItem("medbank_selected_package"));
      console.log(`[Exam Runtime] Fetching questions for product: ${effectivePackageId}`);

      let ordered = null;
      let selectedIds = null;
      let sourceAnswers = null;
      let usingAttemptSnapshot = false;

      if (!testData.isReview && !testData.testAttemptId) {
        try {
          const toSave = {
            ...testData,
            testId: String(testData.testId || ''),
            userId: testData.userId || localStorage.getItem("medbank_user"),
            packageId: testData.packageId || localStorage.getItem("medbank_selected_package") || "14",
            packageName: testData.packageName || localStorage.getItem("medbank_selected_package_name") || null,
            questions: (Array.isArray(testData.questions) ? testData.questions : []).map(q => {
              if (typeof q === 'object' && q !== null) return String(q.id);
              return String(q);
            }),
            isSuspended: false
          };

          const saved = await saveTest(toSave);
          const attemptId = saved?.testAttemptId || saved?.latestAttemptId || null;
          if (attemptId) {
            setTestAttemptId(attemptId);
            localStorage.setItem(
              "medbank_current_test",
              JSON.stringify({
                ...testData,
                ...(saved || {}),
                testAttemptId: attemptId
              })
            );
          }
        } catch (e) {
          console.error('[Exam Runtime] Failed to ensure testAttemptId:', e);
        }
      }
      
      // Attempt is the single source of truth: load question snapshots + answers from attempt when possible
      const attemptId = testData.testAttemptId || JSON.parse(localStorage.getItem('medbank_current_test') || '{}')?.testAttemptId || null;
      if (attemptId) {
        try {
          const attempt = await getTestById(attemptId, effectivePackageId);
          if (attempt && Array.isArray(attempt.questions) && attempt.questions.length > 0) {
            ordered = attempt.questions;
            selectedIds = ordered.map(q => String(q.id)).filter(Boolean);
            sourceAnswers = attempt.answers || {};
            usingAttemptSnapshot = true;

            setQuestions(ordered);
            setAnswers(sourceAnswers);

            // Restore lock state
            if (testData.isReview) {
              setLockedAnswers(sourceAnswers);
            } else if ((testMode || '').toLowerCase() === 'tutor') {
              setLockedAnswers(testData.lockedAnswers || {});
            } else if (testData.resumeData?.isOmittedResume && !testData.resumeData?.isSuspended) {
              setLockedAnswers(sourceAnswers);
            } else {
              setLockedAnswers({});
            }
          }
        } catch (e) {
          console.error('[Exam Runtime] Failed to load attempt snapshot; falling back to product universe', e);
        }
      }

      if (!usingAttemptSnapshot) {
        const all = await getAllQuestions(effectivePackageId);
        const rawIds = testData.questions || [];
        selectedIds = rawIds.map(id => {
          if (typeof id === 'object' && id !== null) return String(id.id);
          return String(id);
        });
        
        console.log(`[Exam Runtime] Questions to load:`, selectedIds);
        
        const selected = all.filter(q => selectedIds.includes(String(q.id)));
        ordered = selectedIds.map(id => selected.find(q => String(q.id) === id)).filter(Boolean);
        sourceAnswers = testData.answers || testData.resumeData?.answers || {};

        if (ordered.length === 0 && selectedIds.length > 0) {
          console.error(`[Exam Runtime] CRITICAL: No questions found from universe match selected IDs. IDs requested:`, selectedIds);
        }

        setQuestions(ordered);
      }
      
      // Handle Resumption, Review, or Persistence from Refresh
      const savedFirstAnswers = testData.firstAnswers || testData.resumeData?.firstAnswers || {};
      setFirstAnswers(savedFirstAnswers);
      const savedIndex = testData.currentIndex ?? testData.resumeData?.currentIndex ?? 0;
      let savedTime = testData.elapsedTime ?? testData.resumeData?.elapsedTime ?? 0;
      const savedDurations = testData.questionDurations || testData.resumeData?.questionDurations || {};
      setQuestionDurations(savedDurations);

      // If resuming a TIMED test that expired, grant "appropriate time" (e.g. 60s per omitted)
      if (testMode === "timed" && testData.resumeData?.isOmittedResume) {
        const timeLimit = (selectedIds || []).length * 90;
        if (savedTime >= timeLimit) {
          const omittedCount = (selectedIds || []).filter(id => !sourceAnswers?.[id]).length;
          // Set elapsed time so they have 60s per omitted question left
          savedTime = Math.max(0, timeLimit - (omittedCount * 60));
        }
      }

      const savedMarked = testData.markedIds ?? testData.resumeData?.markedIds ?? [];

      if (!usingAttemptSnapshot) {
        setAnswers(sourceAnswers);
      }

      // Lock answers based on mode and session state
      const isActuallyTimed = (testData.mode || "").toLowerCase() === 'timed';
      const isActuallyTutor = (testData.mode || "").toLowerCase() === 'tutor';

      if (testData.isReview) {
        setLockedAnswers(sourceAnswers);
      } else if (isActuallyTutor) {
        setLockedAnswers(testData.lockedAnswers || {});
      } else if (testData.resumeData?.isOmittedResume && !testData.resumeData?.isSuspended) {
        // Resuming omitted questions from a FINISHED test - lock already answered ones
        setLockedAnswers(sourceAnswers);
      } else {
        setLockedAnswers({});
      }

      // Handle Landing Index
      let targetIndex = savedIndex;
      if (testData.resumeData?.isOmittedResume) {
        const firstOmittedIdx = ordered.findIndex(qObj => !sourceAnswers[qObj.id]);
        if (firstOmittedIdx !== -1) {
          targetIndex = firstOmittedIdx;
        }
      }

      setCurrentIndex(targetIndex);
      setElapsedTime(savedTime);
      setMarkedQuestions(new Set(savedMarked));

      // Safety Check: Ensure this test belongs to the current user
      const currentUser = localStorage.getItem("medbank_user");
      if (testData.userId && testData.userId !== currentUser) {
        localStorage.removeItem("medbank_current_test");
        router.push("/student/qbank/create-test");
        return;
      }

      // Ensure test has unique ID early and it persists
      const persistentId = String(testData.testId || testData.resumeData?.originalTestId || Date.now());
      setSessionTestId(persistentId);

      if (String(testData.testId) !== persistentId || !testData.userId) {
        testData.testId = persistentId;
        testData.userId = currentUser;
        localStorage.setItem("medbank_current_test", JSON.stringify(testData));
      }

      const activeQuestion = ordered[targetIndex];
      if (activeQuestion) {
        const currentAnswer = sourceAnswers[activeQuestion.id];
        if (testData.isReview || (isActuallyTutor && currentAnswer)) {
          setSelectedAnswer(currentAnswer);
          setIsSubmitted(true);
        } else if (currentAnswer) {
          setSelectedAnswer(currentAnswer);
          setIsSubmitted(false);
        } else {
          setSelectedAnswer(null);
          setIsSubmitted(false);
        }
      }

      if (testData.resumeData?.originalTestId) {
        setOriginalTestId(testData.resumeData.originalTestId);
      }
    }
    fetchQuestions();
  }, [router]);

  // Sync state to localStorage AND History for robust persistence
  useEffect(() => {
    if (questions.length === 0 || isReviewMode || isEnding) return;

    const userId = localStorage.getItem("medbank_user");
    const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");

    // 1. Update Current Session (Use currentTestData.testId which is now guaranteed by load effect)
    const activeTestId = sessionTestId || String(currentTestData.testId || currentTestData.resumeData?.originalTestId || "");
    if (!activeTestId) return; // Prevent sync if ID isn't ready

    // Only persist non-answer UI/session fields here.
    // Answer + flag writes must be persisted together with DB writes (see syncQuestionProgress/toggleMark).
    const updatedTestData = {
      ...currentTestData,
      testId: activeTestId,
      currentIndex,
      elapsedTime,
      firstAnswers,
      questionDurations
    };
    localStorage.setItem("medbank_current_test", JSON.stringify(updatedTestData));
  }, [currentIndex, elapsedTime, questions.length, isReviewMode, questionDurations, firstAnswers, isEnding]);

  // Real-time synchronization helper - NOW ATTEMPT SCOPED
  const ensureAttemptId = async () => {
    const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
    const existing = testAttemptId || currentTestData.testAttemptId || null;
    if (existing) return existing;

    // Create attempt immediately via saveTest and persist
    try {
      const activeTestId = sessionTestId || String(currentTestData.testId || currentTestData.resumeData?.originalTestId || "");
      const saved = await saveTest({
        ...currentTestData,
        testId: activeTestId,
        userId: currentTestData.userId || localStorage.getItem("medbank_user"),
        packageId: currentTestData.packageId || localStorage.getItem("medbank_selected_package") || "14",
        packageName: currentTestData.packageName || localStorage.getItem("medbank_selected_package_name") || null,
        isSuspended: false
      });
      const attemptId = saved?.testAttemptId || saved?.latestAttemptId || null;
      if (attemptId) {
        setTestAttemptId(attemptId);
        localStorage.setItem(
          "medbank_current_test",
          JSON.stringify({ ...currentTestData, ...(saved || {}), testAttemptId: attemptId })
        );
      }
      return attemptId;
    } catch (e) {
      console.error('[Exam Runtime] Failed to create attemptId on-demand:', e);
      return null;
    }
  };

  const persistAttemptAnswerForCurrentQuestion = async (letter, nextAnswers) => {
    if (isReviewMode || isEnding) return false;

    const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
    const attemptId = await ensureAttemptId();
    if (!attemptId) {
      console.error("[Exam Runtime] No testAttemptId found for attempt-scoped write.");
      return false;
    }

    const q = questions[currentIndex];
    if (!q) return false;

    const ok = await updateAttemptAnswer(attemptId, q.id, letter || null);
    if (!ok) {
      console.error('[Exam Runtime] Failed to persist attempt answer to DB', { attemptId, questionId: q.id });
      return false;
    }

    // DB write succeeded; persist localStorage together
    const updated = { ...currentTestData, answers: nextAnswers };
    localStorage.setItem('medbank_current_test', JSON.stringify(updated));
    return true;
  };

  const q = questions[currentIndex];
  const totalQuestions = questions.length;

  // Global Timer
  useEffect(() => {
    if (isReviewMode) return;
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
  }, [isReviewMode, mode, isSubmitted, questions, currentIndex]);

  // Auto-end side effect for Timed Mode
  useEffect(() => {
    if (mode === "timed" && !isReviewMode && totalQuestions > 0 && !modal.show && !isEnding) {
      const timeLimit = totalQuestions * 90;
      if (elapsedTime >= timeLimit) {
        setModal({
          show: true,
          title: "Time Expired!",
          message: "The time for this block has run out. You can choose to end and submit the test now, or suspend it to finish unanswered questions later from your history.",
          type: "warning",
          confirmText: "End Block Now",
          onConfirm: () => handleEndBlock(true),
          secondaryAction: {
            label: "Suspend & Resume Later",
            onClick: () => handleSuspend(false)
          }
        });
      }
    }
  }, [elapsedTime, mode, isReviewMode, totalQuestions, modal.show, isEnding]);

  // Sync state to handleEndBlockRef
  useEffect(() => {
    handleEndBlockRef.current = handleEndBlock;
  });

  // Handle Browser Back Button as End Block
  useEffect(() => {
    if (isReviewMode) return;

    const handlePopState = (e) => {
      // Re-push state to stay on page initially
      window.history.pushState(null, "", window.location.href);

      // Treat back button as "End Block"
      if (handleEndBlockRef.current) {
        handleEndBlockRef.current();
      }
    };

    // Push initial entry to intercept the first 'back' click
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isReviewMode, router]);


  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectAnswer = async (letter) => {
    if (isReviewMode) return;
    if (isSubmitted) return;
    if (lockedAnswers[q.id]) return;

    // Track the first answer ever picked for this session
    if (!firstAnswers[q.id]) {
      setFirstAnswers(prev => ({ ...prev, [q.id]: letter }));
    }

    if (selectedAnswer === letter) {
      // Unchoose
      // Remove strikeout if selecting
      if (strikeouts[q.id]?.has(letter)) {
        toggleStrikeout(letter);
      }

      const nextAnswers = { ...answers };
      delete nextAnswers[q.id];
      const persisted = await persistAttemptAnswerForCurrentQuestion(null, nextAnswers);
      if (!persisted) return;

      setSelectedAnswer(null);
      setAnswers(nextAnswers);
      return;
    }

    // Choose or Change
    setSelectedAnswer(letter);

    const nextAnswers = { ...answers, [q.id]: letter };
    const persisted = await persistAttemptAnswerForCurrentQuestion(letter, nextAnswers);
    if (!persisted) {
      setSelectedAnswer(answers[q.id] || null);
      return;
    }

    setAnswers(nextAnswers);
  };

  const toggleStrikeout = async (letter) => {
    if (isReviewMode || isSubmitted) return;

    // If striking out the selected option, treat as an UNSELECT action and persist to DB+localStorage.
    if (selectedAnswer === letter && answers[q.id] === letter) {
      const nextAnswers = { ...answers };
      delete nextAnswers[q.id];
      const persisted = await persistAttemptAnswerForCurrentQuestion(null, nextAnswers);
      if (!persisted) return;
      setSelectedAnswer(null);
      setAnswers(nextAnswers);
    }

    setStrikeouts(prev => {
      const qStrikeouts = new Set(prev[q.id] || []);
      if (qStrikeouts.has(letter)) {
        qStrikeouts.delete(letter);
      } else {
        qStrikeouts.add(letter);
      }
      return { ...prev, [q.id]: qStrikeouts };
    });
  };

  const handleSubmit = () => {
    if (isReviewMode) return;
    if (!selectedAnswer) return;
    
    if (mode === "tutor") {
      (async () => {
        const nextAnswers = { ...answers, [q.id]: selectedAnswer };
        const persisted = await persistAttemptAnswerForCurrentQuestion(selectedAnswer, nextAnswers);
        if (!persisted) {
          console.error('[Exam Runtime] Tutor submit failed to persist answer; keeping session unsubmitted');
          return;
        }
        setAnswers(nextAnswers);

        // Lock after submit (tutor semantics)
        const nextLocked = { ...lockedAnswers, [q.id]: selectedAnswer };
        setLockedAnswers(nextLocked);
        setIsSubmitted(true);

        try {
          const currentTestData = JSON.parse(localStorage.getItem('medbank_current_test') || '{}');
          localStorage.setItem('medbank_current_test', JSON.stringify({ ...currentTestData, lockedAnswers: nextLocked }));
        } catch (e) {
          console.error('[Exam Runtime] Failed to persist lockedAnswers to localStorage:', e);
        }
      })();
    } else {
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const previousAnswer = answers[questions[nextIdx]?.id] || null;
      setSelectedAnswer(previousAnswer);
      const nextQId = questions[nextIdx]?.id;
      setIsSubmitted(isReviewMode || ((mode === 'tutor') && !!lockedAnswers[nextQId]));
    } else if (!isReviewMode) {
      handleEndBlock();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const previousAnswer = answers[questions[prevIdx]?.id] || null;
      setSelectedAnswer(previousAnswer);
      const prevQId = questions[prevIdx]?.id;
      setIsSubmitted(isReviewMode || ((mode === 'tutor') && !!lockedAnswers[prevQId]));
    }
  };

  const toggleMark = async () => {
    const newMarked = new Set(markedQuestions);
    const isNowMarked = !newMarked.has(q.id);

    // Flagged is an overlay state, and per-attempt only.
    if (isReviewMode) {
      return;
    }

    // Atomic attempt update + localStorage sync (together)
    const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
    const attemptId = await ensureAttemptId();
    if (!attemptId) {
      console.error('[Exam Runtime] No testAttemptId found for attempt-scoped flag write.');
      return;
    }

    const ok = await updateAttemptFlag(attemptId, q.id, isNowMarked);
    if (!ok) {
      console.error('[Exam Runtime] Failed to persist attempt flag to DB', { attemptId, questionId: q.id });
      return;
    }

    // DB write succeeded; update React state + localStorage together
    if (newMarked.has(q.id)) newMarked.delete(q.id);
    else newMarked.add(q.id);
    setMarkedQuestions(newMarked);

    try {
      
      // Keep local session storage in sync for UI state retention
      const updatedLocal = {
        ...currentTestData,
        markedIds: Array.from(newMarked)
      };
      localStorage.setItem("medbank_current_test", JSON.stringify(updatedLocal));
      
    } catch (err) {
      console.error("Failed to sync flag status:", err);
    }
  };

  const handleSuspend = (showConfirm = true) => {
    if (isReviewMode) {
      router.push("/student/qbank/test-summary");
      return;
    }

    const executeSuspend = async () => {
      setIsEnding(true);
      const testData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
      const activeTestId = sessionTestId || String(testData.testId || "");

      // Persist attempt snapshot before suspending (mandatory)
      try {
        const attemptId = await ensureAttemptId();
        if (attemptId) {
          const snap = {
            questionIds: questions.map(qObj => String(qObj?.id)).filter(Boolean),
            answers: { ...answers },
            markedIds: Array.from(markedQuestions).map(String),
            timeSpent: { ...questionDurations },
            elapsedTime,
            questionSnapshots: questions
          };
          const ok = await snapshotAttempt(attemptId, snap);
          if (!ok) {
            console.error('[Exam Runtime] snapshotAttempt failed during suspend; aborting suspend to prevent DB/local mismatch');
            setIsEnding(false);
            return;
          }
        }
      } catch (e) {
        console.error('[Exam Runtime] Failed to snapshot attempt during suspend:', e);
      }

      const sessionToSave = {
        testId: activeTestId,
        testNumber: testData.testNumber || Date.now() % 10000,
        userId: testData.userId || localStorage.getItem("medbank_user"),
        packageId: testData.packageId || localStorage.getItem("medbank_selected_package") || "14",
        packageName: testData.packageName || localStorage.getItem("medbank_selected_package_name") || "Premium Stream",
        date: testData.date || new Date().toISOString(),
        questions: questions.map(q => ({
          id: q?.id,
          correct: q?.correct,
          userAnswer: answers[q?.id] || null,
          subject: q?.subject,
          system: q?.system,
          timeSpent: questionDurations[q?.id] || 0
        })),
        mode,
        pool: testData.pool || "All Questions",
        answers,
        firstAnswers,
        questionDurations,
        currentIndex,
        elapsedTime,
        markedIds: Array.from(markedQuestions),
        isSuspended: true,
        universeSize: testData.universeSize || questions.length,
        eligiblePoolSize: testData.eligiblePoolSize || questions.length,
        poolLogic: testData.poolLogic || {}
      };

      await saveTest(sessionToSave);
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
  };

  const handleEndBlock = (isAuto = false) => {
    const processSubmission = async () => {
      setIsEnding(true);
      
      const currentTestData = JSON.parse(localStorage.getItem("medbank_current_test") || "{}");
      const activeTestId = sessionTestId || String(currentTestData.testId || "");
      
      if (isReviewMode) {
        router.push("/student/qbank/test-summary");
        return;
      }

      let attemptIdToFinish = testAttemptId || currentTestData.testAttemptId || null;
      if (!attemptIdToFinish && !isReviewMode) {
        try {
          const saved = await saveTest({
            ...currentTestData,
            testId: activeTestId,
            userId: currentTestData.userId || localStorage.getItem("medbank_user"),
            packageId: currentTestData.packageId || localStorage.getItem("medbank_selected_package") || "14",
            packageName: currentTestData.packageName || localStorage.getItem("medbank_selected_package_name") || null,
            isSuspended: false
          });
          attemptIdToFinish = saved?.testAttemptId || saved?.latestAttemptId || null;
          if (attemptIdToFinish) {
            setTestAttemptId(attemptIdToFinish);
            localStorage.setItem(
              "medbank_current_test",
              JSON.stringify({
                ...currentTestData,
                ...(saved || {}),
                testAttemptId: attemptIdToFinish
              })
            );
          }
        } catch (e) {
          console.error('[Exam Runtime] Failed to create attempt during submission:', e);
        }
      }

      if (attemptIdToFinish) {
        const snapshot = {
          questionIds: questions.map(qObj => String(qObj?.id)).filter(Boolean),
          answers: { ...answers },
          markedIds: Array.from(markedQuestions).map(String),
          timeSpent: { ...questionDurations },
          elapsedTime,
          questionSnapshots: questions
        };

        const ok = await finishAttempt(attemptIdToFinish, snapshot);
        if (!ok) {
          console.error('[Exam Runtime] finishAttempt failed; aborting redirect to prevent DB/local mismatch');
          return;
        }

        localStorage.setItem("medbank_last_attempt_id", attemptIdToFinish);
      } else {
        console.error("CRITICAL: No testAttemptId found during submission!");
      }

      localStorage.setItem("medbank_last_test_id", activeTestId);
      localStorage.removeItem("medbank_current_test");
      
      // Dispatch refresh event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event("medbank_progress_refresh"));
      }

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
  };

  if (questions.length === 0 || !q) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002b5c]"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f3f4f6] dark:bg-[#0F0F12] flex flex-col z-[9999] font-sans overflow-hidden select-none text-[#333] dark:text-zinc-300 transition-colors duration-300">
      
      {/* HEADER */}
      <header className="bg-[#002b5c] text-white h-[45px] flex items-center px-4 shrink-0 shadow-lg z-50 font-medium relative border-b border-white/10">
        <div className="flex items-center gap-5">
          <div className="flex gap-4">
            <Menu 
              size={18} 
              className="cursor-pointer hover:text-blue-300 transition-colors opacity-70" 
              onClick={() => setShowQuestionList(!showQuestionList)}
            />
            <div className="flex items-center gap-3 ml-2 border-l border-white/10 pl-4">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Item ID:</span>
              <span className="text-[14px] font-bold text-white tracking-tight leading-none">{q.id}</span>
            </div>
          </div>
          <div 
            onClick={toggleMark}
            className="flex items-center gap-1.5 cursor-pointer group ml-2 hover:text-orange-400 transition-colors"
          >
            <Flag size={14} className={markedQuestions.has(q?.id) ? "fill-orange-500 text-orange-500" : "text-white/50 group-hover:text-white"} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${markedQuestions.has(q?.id) ? "text-orange-500" : "text-white/80"}`}>Mark</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <span className="text-[13px] font-bold">
            {currentIndex + 1}/{totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 mr-4">
            {[
              { Icon: ZoomIn, label: 'Zoom' },
              { Icon: Settings, label: 'Settings' },
              { Icon: HelpCircle, label: 'Help' },
              { Icon: Maximize2, label: 'Full' }
            ].map((tool, i) => (
              <tool.Icon key={i} size={18} className="cursor-pointer hover:text-blue-300 transition-colors opacity-70" />
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-[16px] font-bold tracking-tight bg-black/20 px-3 py-1 rounded border border-white/5">
            {mode === "timed"
              ? formatTime(Math.max(0, (totalQuestions * 90) - elapsedTime))
              : formatTime(elapsedTime)
            }
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* NAV BAR SIDEBAR (QUESTION LIST) */}
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

            // Show correctness in Review mode or Tutor mode after answering
            const showResult = isReviewMode || (mode === "tutor" && hasAnswer);
            const isCorrect = showResult && hasAnswer && userAnswer === qItem.correct;
            const isWrong = showResult && hasAnswer && userAnswer !== qItem.correct;

            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  const previousAnswer = answers[questions[idx]?.id] || null;
                  setSelectedAnswer(previousAnswer);
                  setIsSubmitted(isReviewMode || !!previousAnswer);
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

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#16161a] p-6 lg:p-8 transition-colors duration-300">
          <div className="w-full flex flex-col gap-10">
          
            {/* TOP SECTION: Question Context (Stem) */}
            <div className="w-full space-y-6">
              <div className="text-[18px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap">
              {q.stem}
              {q.stemImage?.data && (
                <div className="mt-8 flex justify-center">
                  <img src={q.stemImage.data} alt="stem" className="max-w-full rounded border-2 border-zinc-100 shadow-sm" />
                </div>
              )}
            </div>
          </div>

            {/* BOTTOM SECTION: Choices and Rest of Parts */}
            <div className="w-full space-y-10">
            {/* Choices */}
              <div className="space-y-4">
              {q.choices.map((choice, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = selectedAnswer === letter;
                const isCorrect = q.correct === letter;
                const isStruck = strikeouts[q.id]?.has(letter);
                
                const isLocked = !!lockedAnswers[q.id];
                
                let choiceStyle = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50";
                let radioStyle = "border-zinc-400 dark:border-zinc-600 border-[3px]";

                if (isLocked) {
                  choiceStyle = "opacity-80 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20 cursor-not-allowed";
                }
                
                if (isSelected) {
                  radioStyle = "border-[#0072bc] bg-[#0072bc]";
                }

                if (isReviewMode || (mode === "tutor" && isSubmitted)) {
                  choiceStyle = "border-transparent bg-transparent pointer-events-none";
                  if (isSelected) {
                    radioStyle = "border-[#0072bc] bg-[#0072bc]";
                  } else if (isCorrect) {
                    radioStyle = "border-zinc-300 border-[3px]";
                  } else {
                    radioStyle = "border-zinc-200 border-[2px] opacity-40";
                  }
                }

                const showFeedback = isReviewMode || (mode === "tutor" && isSubmitted);

                // Real Stats Calculation
                const dist = q.choiceDistribution || {};
                const totalPicks = Object.values(dist).reduce((a, b) => a + b, 0);
                const pickCount = dist[letter] || 0;
                const percentage = totalPicks > 0 ? Math.round((pickCount / totalPicks) * 100) : 0;

                return (
                  <div 
                    key={i}
                    className={`flex items-start gap-2 rounded-md transition-all border ${choiceStyle} relative group`}
                  >
                    {/* Feedback Icons (X or Check) */}
                    {showFeedback && (
                      <div className="w-6 shrink-0 flex items-center justify-center mt-1.5">
                        {isCorrect && <Check size={20} className="text-green-500 stroke-[4px]" />}
                        {isSelected && !isCorrect && <X size={20} className="text-red-500 stroke-[4px]" />}
                      </div>
                    )}

                    <div className="flex flex-1 items-start gap-4 p-4 py-2.5">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAnswer(letter);
                        }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${radioStyle} ${isStruck ? 'opacity-20' : ''}`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                      </div>
                      <div
                        className="flex-1 flex flex-col gap-2 cursor-pointer relative"
                        onClick={() => toggleStrikeout(letter)}
                      >
                        <span className={`text-[15px] select-none ${isStruck ? 'line-through text-zinc-400 dark:text-zinc-600' : isSelected ? "font-bold text-zinc-900 dark:text-[#f8fafc]" : "font-medium text-zinc-700 dark:text-zinc-300"}`}>
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

            {/* Submit / Action Button */}
            {!isReviewMode && (
              <div className="pt-2">
                <button 
                  onClick={handleSubmit}
                  disabled={!selectedAnswer || (mode === "tutor" && isSubmitted)}
                  className="w-full sm:w-auto bg-[#0072bc] hover:bg-[#005a96] text-white px-12 py-3 rounded shadow-lg font-bold text-[13px] uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-[#0072bc]"
                >
                  {mode === "tutor" ? "Submit" : "Next"}
                </button>
              </div>
            )}

            {/* Explanation (Tutor or Review Mode) */}
            {(isReviewMode || (mode === "tutor" && isSubmitted)) && (
                <div className="p-8 lg:p-10 bg-white dark:bg-zinc-900/50 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
                <div className="space-y-8">
                    <div className="max-w-none">
                    <div className={`flex items-center gap-10 p-6 rounded-lg mb-8 bg-[#1e1e24] dark:bg-zinc-800/50 border-l-[6px] transition-all ${selectedAnswer === q.correct ? 'border-green-500' : 'border-red-500'}`}>
                      <div className="flex flex-col min-w-[100px]">
                        <span className={`text-[20px] font-bold ${selectedAnswer === q.correct ? 'text-green-500' : 'text-red-500'}`}>
                          {!selectedAnswer ? 'Omitted' : (selectedAnswer === q.correct ? 'Correct' : 'Incorrect')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 border-l border-zinc-700/50 pl-10 h-10">
                        <BarChart2 size={24} className="text-zinc-400 opacity-60" strokeWidth={1.5} />
                        <div className="flex flex-col">
                          <span className="text-zinc-100 dark:text-zinc-200 font-bold leading-none text-lg">
                            {(() => {
                              const dist = q.choiceDistribution || {};
                              const totalPicks = Object.values(dist).reduce((a, b) => a + b, 0);
                              const correctPicks = dist[q.correct] || 0;
                              return totalPicks > 0 ? Math.round((correctPicks / totalPicks) * 100) : 0;
                            })()}%
                          </span>
                          <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mt-1">Answered correctly</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 border-l border-zinc-700/50 pl-10 h-10">
                        <Clock size={24} className="text-zinc-400 opacity-60" strokeWidth={1.5} />
                        <div className="flex flex-col">
                          <span className="text-zinc-100 dark:text-zinc-200 font-bold leading-none text-lg">
                            {questionDurations[q.id] || 0} secs
                          </span>
                          <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mt-1">Time Spent</span>
                        </div>
                      </div>
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
                        <p className="font-bold text-[16px] text-zinc-900 dark:text-zinc-200 italic">"{q.summary}"</p>
                    </div>
                  )}
                </div>


                </div>
              )}
            </div>
          </div>
        </main>
      </div>



      {/* FOOTER */}
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

      <style jsx global>{`
        body { overflow: hidden; }
        ::selection { background: #bfdbfe; color: #1e3a8a; }
      `}</style>

      {/* CUSTOM CONFIRMATION MODAL */}
      {modal.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#001b3d]/60 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setModal({ ...modal, show: false })} />
          <div className="bg-white dark:bg-[#16161a] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative max-w-[400px] w-full overflow-hidden animate-in zoom-in-95 fade-in duration-300 border-none">
            {/* Header section based on type */}
            {modal.type === 'danger' && (
              <div className="bg-[#fffbeb] p-8 flex flex-col items-center border-b border-amber-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-[0_4px_10px_rgba(217,119,6,0.15)]">
                  <AlertTriangle size={32} className="text-amber-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#92400e] text-center">
                  {modal.title}
                </h3>
              </div>
            )}
            {modal.type === 'confirm' && (
              <div className="bg-emerald-50 p-8 flex flex-col items-center border-b border-emerald-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-[0_4px_10px_rgba(16,185,129,0.15)]">
                  <Check size={32} className="text-emerald-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-emerald-800 text-center">
                  {modal.title}
                </h3>
              </div>
            )}
            {modal.type === 'info' && (
              <div className="bg-blue-50 p-8 flex flex-col items-center border-b border-blue-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-[0_4px_10px_rgba(59,130,246,0.15)]">
                  <LogOut size={32} className="text-blue-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-800 text-center">
                  {modal.title}
                </h3>
              </div>
            )}

            <div className="p-10 pt-8 bg-[#1e1e24] dark:bg-[#16161a]">
              <p className="text-[15px] font-medium leading-relaxed text-zinc-400 text-center mb-10">
                {modal.message}
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    modal.onConfirm();
                    setModal({ ...modal, show: false });
                  }}
                  className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${modal.type === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'
                    : modal.type === 'confirm'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30'
                    : 'bg-[#1d46af] text-white hover:bg-[#16368a] shadow-blue-500/30'
                    }`}
                >
                  {modal.confirmText || 'Confirm & Continue'}
                </button>
                <button
                  onClick={() => setModal({ ...modal, show: false })}
                  className="w-full py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
