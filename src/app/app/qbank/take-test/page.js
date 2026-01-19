"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllQuestions } from "@/services/question.service";
import { 
  Menu, Flag, ChevronLeft, ChevronRight, Maximize2, 
  HelpCircle, FlaskConical, StickyNote, Calculator, 
  Contrast, ZoomIn, Settings, BookOpen, Layers, 
  MessageSquare, PauseCircle, LogOut 
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
  const router = useRouter();

  // Load test configuration
  useEffect(() => {
    const testData = JSON.parse(localStorage.getItem("medbank_current_test"));
    if (!testData || !testData.questions) {
      router.push("/app/qbank/create-test");
      return;
    }

    setMode(testData.mode || "tutor");
    setIsReviewMode(!!testData.isReview);
    
    async function fetchQuestions() {
      const all = await getAllQuestions();
      const selectedIds = testData.questions;
      // Filter the actual question objects based on IDs from localStorage
      const selected = all.filter(q => selectedIds.includes(q.id));
      
      // Keep the order as defined in the testData
      const ordered = selectedIds.map(id => selected.find(q => q.id === id)).filter(Boolean);
      setQuestions(ordered);

      // Handle Resumption or Review
      if (testData.resumeData || testData.isReview) {
        const sourceAnswers = testData.resumeData?.answers || testData.answers || {};
        setAnswers(sourceAnswers);
        setLockedAnswers(sourceAnswers); // Lock existing answers
        setCurrentIndex(testData.resumeData?.currentIndex || 0);
        setElapsedTime(testData.resumeData?.elapsedTime || testData.elapsedTime || 0);

        if (testData.resumeData?.originalTestId) {
          setOriginalTestId(testData.resumeData.originalTestId);
        }

        // Load previously marked questions
        const previouslyMarked = testData.resumeData?.markedIds || testData.markedIds || [];
        setMarkedQuestions(new Set(previouslyMarked));
        
        const currentQId = ordered[testData.resumeData?.currentIndex || 0]?.id;
        if (sourceAnswers[currentQId]) {
          setSelectedAnswer(sourceAnswers[currentQId]);
          setIsSubmitted(true);
        }
      }
    }
    fetchQuestions();
  }, [router]);

  // Global Timer (only if not in review mode)
  useEffect(() => {
    if (isReviewMode) return;
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isReviewMode]);

  const q = questions[currentIndex];
  const totalQuestions = questions.length;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectAnswer = (letter) => {
    if (isReviewMode) return; // Disable changes in review mode
    if (mode === "tutor" && isSubmitted) return;
    if (lockedAnswers[q.id]) return; // Cannot change previously answered questions in resumed session
    
    setSelectedAnswer(letter);
    if (mode === "timed") {
      setAnswers(prev => ({ ...prev, [q.id]: letter }));
    }
  };

  const handleSubmit = () => {
    if (isReviewMode) return;
    if (!selectedAnswer) return;
    
    if (mode === "tutor") {
      setIsSubmitted(true);
      setAnswers(prev => ({ ...prev, [q.id]: selectedAnswer }));
    } else {
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const previousAnswer = answers[questions[nextIdx].id] || null;
      setSelectedAnswer(previousAnswer);
      setIsSubmitted(isReviewMode || !!previousAnswer);
    } else if (!isReviewMode) {
      handleEndBlock();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const previousAnswer = answers[questions[prevIdx].id] || null;
      setSelectedAnswer(previousAnswer);
      setIsSubmitted(isReviewMode || !!previousAnswer);
    }
  };

  const toggleMark = () => {
    if (isReviewMode) return;
    const newMarked = new Set(markedQuestions);
    if (newMarked.has(q.id)) newMarked.delete(q.id);
    else newMarked.add(q.id);
    setMarkedQuestions(newMarked);
  };

  const handleSuspend = () => {
    if (isReviewMode) {
      router.push("/app/qbank/test-summary");
      return;
    }
    if (confirm("Suspend this test? Your progress will be saved.")) {
      const currentUserId = localStorage.getItem("medbank_user");
      const historyKey = `medbank_test_history_${currentUserId}`;
      const suspendedTest = {
        testId: Date.now(),
        date: new Date().toISOString(),
        questions: questions.map(q => q.id),
        answers,
        currentIndex,
        elapsedTime,
        mode,
        isSuspended: true
      };
      const allTests = JSON.parse(localStorage.getItem(historyKey) || "[]");
      allTests.push(suspendedTest);
      localStorage.setItem(historyKey, JSON.stringify(allTests));
      localStorage.removeItem("medbank_current_test");
      router.push("/app/qbank");
    }
  };

  const handleEndBlock = () => {
    if (isReviewMode) {
      router.push("/app/qbank/test-summary");
      return;
    }

    const unansweredCount = questions.length - Object.keys(answers).length;
    let msg = "Are you sure you want to end this block?";
    if (unansweredCount > 0) {
      msg = `You have ${unansweredCount} unanswered questions. Are you sure you want to end this block?`;
    }

    if (confirm(msg)) {
      const results = {
        testId: Date.now(),
        date: new Date().toISOString(),
        mode,
        questions: questions.map(quest => ({
          id: quest.id,
          correct: quest.correct,
          userAnswer: answers[quest.id] || null,
          subject: quest.subject,
          system: quest.system
        })),
        answers,
        elapsedTime,
        markedIds: Array.from(markedQuestions)
      };

      // --- Meticulous QBank Status Categorization ---
      const userId = localStorage.getItem("medbank_user");
      const statsKey = `medbank_qbank_stats_${userId}`;
      const historyKey = `medbank_test_history_${userId}`;

      const masterStats = JSON.parse(localStorage.getItem(statsKey) || "{}");
      results.questions.forEach(item => {
        const stats = masterStats[item.id] || { status: "unused", history: [], isMarked: false };
        
        // Define New Status
        let newStatus = stats.status;
        if (!item.userAnswer) {
          if (stats.status === "unused") {
            newStatus = "omitted";
          }
        } else if (item.userAnswer === item.correct) {
          newStatus = "correct";
        } else {
          newStatus = "incorrect";
        }

        stats.status = newStatus;
        stats.isMarked = markedQuestions.has(item.id);

        stats.history.push({
          date: results.date,
          result: newStatus,
          userAnswer: item.userAnswer
        });
        masterStats[item.id] = stats;
      });
      localStorage.setItem(statsKey, JSON.stringify(masterStats));

      // Save History
      const allTests = JSON.parse(localStorage.getItem(historyKey) || "[]");
      const nextNumber = allTests.length > 0 
        ? (Math.max(...allTests.map(t => t.testNumber || 0)) + 1) 
        : 1;
      results.testNumber = nextNumber;
      
      let finalResults = results;

      if (originalTestId) {
        const testIndex = allTests.findIndex(t => t.testId === originalTestId);
        if (testIndex !== -1) {
          const originalTest = allTests[testIndex];
          
          originalTest.questions = originalTest.questions.map(q => {
            const sessionAnswer = answers[q.id];
            if (sessionAnswer) {
              return { ...q, userAnswer: sessionAnswer };
            }
            return q;
          });
          
          originalTest.answers = { ...originalTest.answers, ...answers };
          originalTest.markedIds = Array.from(markedQuestions);
          originalTest.elapsedTime = (originalTest.elapsedTime || 0) + elapsedTime;
          originalTest.isSuspended = false; 
          
          finalResults = originalTest;
          allTests[testIndex] = originalTest;
        } else {
          allTests.push(results);
        }
      } else {
        allTests.push(results);
      }

      localStorage.setItem(historyKey, JSON.stringify(allTests));
      localStorage.setItem("medbank_last_test_id", finalResults.testId);

      // Transition to Summary with Review Data Prepared
      localStorage.setItem("medbank_current_test", JSON.stringify({
        ...finalResults,
        isReview: false 
      }));

      router.push("/app/qbank/test-summary");
    }
  };

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002b5c]"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f3f4f6] flex flex-col z-[9999] font-sans overflow-hidden select-none text-[#333]">
      
      {/* HEADER */}
      <header className="bg-[#002b5c] text-white h-[50px] flex items-center px-4 shrink-0 shadow-lg z-10 font-medium">
        <div className="flex items-center gap-6">
          <Menu size={18} className="cursor-pointer hover:text-blue-300 transition-colors" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              {isReviewMode ? "Review Mode" : `Item ${currentIndex + 1} of ${totalQuestions}`}
            </span>
            <span className="text-[11px] opacity-80 font-mono">Question Id: {q.id}</span>
          </div>
          <div 
            onClick={toggleMark}
            className={`flex items-center gap-2 cursor-pointer group ml-4 bg-white/5 px-3 py-1.5 rounded transition-all ${isReviewMode ? 'opacity-50 cursor-default' : 'hover:bg-white/10'}`}
          >
            <Flag size={14} className={markedQuestions.has(q.id) ? "fill-orange-500 text-orange-500" : "text-white/50 group-hover:text-white"} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${markedQuestions.has(q.id) ? "text-orange-500" : "text-white/80"}`}>Mark</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center gap-8">
          <button 
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-white transition-colors"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] hidden sm:block">Previous</span>
          </button>
          <button 
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1 && (mode === "tutor" || isReviewMode)}
            className="flex items-center gap-1.5 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-white transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] hidden sm:block">Next</span>
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center gap-4">
           {[
             { Icon: Maximize2, label: 'Full Screen' },
             { Icon: HelpCircle, label: 'Tutorial' },
             { Icon: FlaskConical, label: 'Lab Values' },
             { Icon: StickyNote, label: 'Notes' },
             { Icon: Calculator, label: 'Calculator' },
             { Icon: Contrast, label: 'Reverse Color' },
             { Icon: ZoomIn, label: 'Text Zoom' },
             { Icon: Settings, label: 'Settings' }
           ].map((tool, i) => (
             <div key={i} className="flex flex-col items-center cursor-pointer group hover:text-blue-300 transition-colors">
               <tool.Icon size={17} className="mb-0.5" />
               <span className="text-[8px] font-bold uppercase tracking-tighter hidden xl:block opacity-60 group-hover:opacity-100">{tool.label}</span>
             </div>
           ))}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-white p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12 items-start">
          
          {/* LEFT COLUMN: Question Context (Stem) */}
          <div className="lg:sticky lg:top-0 space-y-6">
            <div className="text-[17px] leading-relaxed text-zinc-800 font-medium whitespace-pre-wrap">
              {q.stem}
              {q.stemImage?.data && (
                <div className="mt-8 flex justify-center">
                  <img src={q.stemImage.data} alt="stem" className="max-w-full rounded border-2 border-zinc-100 shadow-sm" />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Choices and Rest of Parts */}
          <div className="space-y-10">
            {/* Choices */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4 px-1">Select the best answer</h4>
              {q.choices.map((choice, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = selectedAnswer === letter;
                const isCorrect = q.correct === letter;
                
                const isLocked = !!lockedAnswers[q.id];
                
                let choiceStyle = "border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 bg-white";
                let radioStyle = "border-zinc-300 group-hover:border-zinc-400 bg-white";

                if (isLocked) {
                  choiceStyle = "opacity-80 border-zinc-100 bg-zinc-50 cursor-not-allowed";
                }
                
                if (isSelected) {
                  choiceStyle = "bg-blue-50/50 border-blue-400";
                  radioStyle = "border-blue-600 bg-blue-600";
                }

                if (isReviewMode || (mode === "tutor" && isSubmitted)) {
                  if (isCorrect) {
                    choiceStyle = "bg-green-50/50 border-green-500 ring-1 ring-green-100";
                    radioStyle = "border-green-600 bg-green-600";
                  } else if (isSelected) {
                    choiceStyle = "bg-red-50/50 border-red-500 ring-1 ring-red-100";
                    radioStyle = "border-red-600 bg-red-600";
                  } else {
                    choiceStyle = "opacity-50 border-zinc-100 bg-zinc-50 pointer-events-none";
                  }
                }

                return (
                  <div 
                    key={i}
                    onClick={() => handleSelectAnswer(letter)}
                    className={`flex items-start gap-5 p-4 rounded-xl cursor-pointer transition-all border-2 group ${choiceStyle}`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${radioStyle}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`text-[15px] ${isSelected ? "font-bold text-zinc-900" : "font-medium text-zinc-700"}`}>
                        {letter}. {choice.text}
                      </span>
                      {choice.image?.data && (
                        <img src={choice.image.data} alt={`choice-${letter}`} className="max-w-xs rounded border mt-2" />
                      )}
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
              <div className="p-8 lg:p-10 bg-zinc-50/80 rounded-2xl border-l-8 border-[#002b5c] shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 text-[#002b5c] mb-8">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="font-bold uppercase tracking-[0.2em] text-[14px]">Educational Objective</h3>
                </div>
                
                <div className="space-y-8">
                  <div className="prose prose-blue max-w-none">
                    <div className={`p-4 rounded-lg mb-6 inline-block font-bold text-sm uppercase tracking-wide ${selectedAnswer === q.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {!selectedAnswer ? 'Question Omitted' : (selectedAnswer === q.correct ? 'Your answer is Correct' : `Your answer is Incorrect (Correct: ${q.correct})`)}
                    </div>
                    
                    <div className="text-[17px] leading-relaxed text-zinc-800 space-y-4">
                        {q.explanationCorrect?.split('\n').map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                  </div>

                  {q.explanationWrong && (
                    <div className="pt-8 border-t border-zinc-200">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">Incorrect Explanations</h4>
                        <div className="text-[15px] leading-relaxed text-zinc-500 italic space-y-3">
                          {q.explanationWrong.split('\n').map((para, i) => <p key={i}>{para}</p>)}
                        </div>
                    </div>
                  )}

                  {q.summary && (
                    <div className="mt-8 p-6 bg-[#002b5c]/5 rounded-xl border border-[#002b5c]/10">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#002b5c]/50 block mb-3">One Liner Summary</span>
                       <p className="font-bold text-[16px] text-[#002b5c] italic">"{q.summary}"</p>
                    </div>
                  )}
                </div>

                <div className="mt-10 pt-8 border-t border-zinc-200 flex justify-between">
                  <button 
                    onClick={handleNext}
                    disabled={currentIndex === totalQuestions - 1}
                    className="bg-zinc-800 text-white px-8 py-2 rounded text-[12px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20"
                  >
                    {isReviewMode ? "Next Item" : "Move to Next Item"}
                  </button>
                  {currentIndex === totalQuestions - 1 && !isReviewMode && (
                    <button 
                      onClick={handleEndBlock}
                      className="bg-red-600 text-white px-8 py-2 rounded text-[12px] font-bold uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all"
                    >
                      Complete Block
                    </button>
                  )}
                  {isReviewMode && (
                    <button 
                      onClick={() => router.push("/app/qbank/test-summary")}
                      className="bg-[#002b5c] text-white px-8 py-2 rounded text-[12px] font-bold uppercase tracking-widest hover:bg-[#001d3d] transition-all"
                    >
                      Back to Stats
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#002b5c] text-white h-[60px] flex items-center px-6 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 opacity-60">
              {isReviewMode ? "Total Block Time" : "Session Timer"}
            </span>
            <span className="text-[18px] font-mono font-black tracking-tight leading-none">{formatTime(elapsedTime)}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex gap-2">
             <div className="w-7 h-7 bg-white/10 rounded-md border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
               <div className="w-3.5 h-[1.5px] bg-white" />
             </div>
             <div className="w-7 h-7 bg-white/10 rounded-md border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
               <div className="w-3 h-3 border-2 border-white" />
             </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-10 mr-10">
           {[
             { Icon: BookOpen, label: 'Notebook' },
             { Icon: Layers, label: 'Flashcards' },
             { Icon: MessageSquare, label: 'Comment' },
             { Icon: PauseCircle, label: 'Suspend' },
           ].map((tool, i) => (
             <div 
               key={i} 
               onClick={tool.label === 'Suspend' ? handleSuspend : undefined} 
               className={`flex flex-col items-center cursor-pointer group hover:text-blue-300 transition-colors ${isReviewMode && tool.label === 'Suspend' ? 'opacity-30' : ''}`}
             >
               <tool.Icon size={19} className="mb-0.5 opacity-80 group-hover:opacity-100" />
               <span className="text-[8px] font-black uppercase tracking-widest hidden lg:block opacity-50 group-hover:opacity-100">
                 {isReviewMode && tool.label === 'Suspend' ? 'Back' : tool.label}
               </span>
             </div>
           ))}
        </div>

        <button 
          onClick={isReviewMode ? () => router.push("/app/qbank") : handleEndBlock}
          className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded flex items-center gap-2.5 transition-all active:scale-95 shadow-lg shadow-red-900/20"
        >
          <LogOut size={16} strokeWidth={2.5} />
          <span className="text-[11px] font-black uppercase tracking-widest">
            {isReviewMode ? "Exit Review" : "End Block"}
          </span>
        </button>
      </footer>

      <style jsx global>{`
        body { overflow: hidden; }
        ::selection { background: #bfdbfe; color: #1e3a8a; }
      `}</style>
    </div>
  );
}
