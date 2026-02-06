"use client";



import { useEffect, useState, useMemo, useContext } from "react";

import { useRouter } from "next/navigation";

import { AppContext } from "@/context/AppContext";

import { getAllQuestions } from "@/services/question.service";

import { getAllTests, saveTest } from "@/services/test.service";

import { getProductById } from "@/services/product.service";

import {

  Check, Info, ChevronUp, ChevronDown, Plus,

  HelpCircle, Clock

} from "lucide-react";



const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Microbiology", "Pharmacology", "Public Health", "Behavioral Science"];

const SYSTEMS = ["Cardiovascular", "Respiratory", "Gastrointestinal", "Renal", "Neurology", "Endocrine", "Hematology & Oncology", "Musculoskeletal & Integumentary", "Reproductive", "Multi-system"];

const STATUS_FILTERS = ["Unused", "Incorrect", "Marked", "Omitted", "Correct"];



export default function CreateTestPage() {

  const [questions, setQuestions] = useState([]);

  const [allQuestionsInProduct, setAllQuestionsInProduct] = useState([]);

  const [productConfig, setProductConfig] = useState(null);

  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const [selectedSystems, setSelectedSystems] = useState([]);

  const [activeFilters, setActiveFilters] = useState([]);

  const [showSubjectWarning, setShowSubjectWarning] = useState(false);

  const [numQuestions, setNumQuestions] = useState(0);

  const [mode, setMode] = useState("tutor");

  const [questionMode, setQuestionMode] = useState("Standard"); // Standard vs Custom



  // Collapse states

  const [isTestModeOpen, setIsTestModeOpen] = useState(true);

  const [isQuestionModeOpen, setIsQuestionModeOpen] = useState(true);

  const [isSubjectsOpen, setIsSubjectsOpen] = useState(true);

  const [isSystemsOpen, setIsSystemsOpen] = useState(true);

  const [isNoQuestionsOpen, setIsNoQuestionsOpen] = useState(true);



  const { selectedStudentProduct } = useContext(AppContext);

  const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;

  const router = useRouter();



  useEffect(() => {

    async function loadQuestions() {

      try {

        if (!userId) {

          console.error("No user ID found");

          return;

        }



        // 1. Determine active product context

        const activeProduct = selectedStudentProduct || 

                             JSON.parse(localStorage.getItem("medbank_focused_product") || "null");

        

        const packageId = activeProduct?.id || "14"; 

        const packageName = activeProduct?.name || "Standard QBank";



        console.log(`[CreateTest] Loading questions for Product: ${packageName} (ID: ${packageId})`);



        localStorage.setItem("medbank_selected_package", packageId);

        localStorage.setItem("medbank_selected_package_name", packageName);



        const p = await getProductById(packageId);

        setProductConfig(p || null);

        

        // 2. Load questions

        const allFetched = await getAllQuestions(packageId);

        const fetchedArray = Array.isArray(allFetched) ? allFetched : [];

        setAllQuestionsInProduct(fetchedArray);

        

        const validQuestions = fetchedArray.filter(q => 

          (q.lifecycleStatus === 'published' || q.status === 'published') && 

          q.system && q.system.trim() !== '' &&

          q.subject && q.subject.trim() !== ''

        );

        

        setQuestions(validQuestions);



        // Reset selections if product changed

        setSelectedSubjects([]);

        setSelectedSystems([]);

        setActiveFilters([]);

        setNumQuestions(0);



      } catch (error) {

        console.error("Error loading questions:", error);

        setQuestions([]);

      }

    }

    loadQuestions();

  }, [selectedStudentProduct, userId]);



  const subjectOptions = useMemo(() => {

    if (productConfig?.templateType === 'ECG') {

      return Array.isArray(productConfig.subjects) ? productConfig.subjects : [];

    }

    const fromQuestions = questions.map(q => q.subject).filter(Boolean);

    return [...new Set([...SUBJECTS, ...fromQuestions])].sort();

  }, [questions, productConfig]);



  const systemOptions = useMemo(() => {

    if (productConfig?.templateType === 'ECG') {

      return Array.isArray(productConfig.systems) ? productConfig.systems : [];

    }

    const fromQuestions = questions.map(q => q.system).filter(Boolean);

    return [...new Set([...SYSTEMS, ...fromQuestions])].sort();

  }, [questions, productConfig]);



  useEffect(() => {

    if (productConfig?.templateType !== 'ECG') return;

    const sys = Array.isArray(productConfig.systems) ? productConfig.systems : [];

    if (sys.length === 0) return;

    if (selectedSystems.length > 0) return;

    setSelectedSystems(sys);

  }, [productConfig, selectedSystems.length]);



  // Filter Counts for the categories

  const filterCounts = useMemo(() => {

    const counts = { Unused: 0, Incorrect: 0, Marked: 0, Omitted: 0, Correct: 0 };

    questions.forEach(q => {

      // attempt-derived status from /api/questions/user; fallback for safety

      const qStatus = q.status === null ? 'omitted' : (q.status || 'unused');

      

      if (qStatus === "unused") counts.Unused++;

      else if (qStatus === "incorrect") counts.Incorrect++;

      else if (qStatus === "omitted") counts.Omitted++;

      else if (qStatus === "correct") counts.Correct++;

      

      if (q.isMarked) counts.Marked++;

    });

    return counts;

  }, [questions]);







  const getFilteredQuestions = useMemo(() => {

    if (activeFilters.length === 0) return questions;

    return questions.filter(q => {

      let statusMatch = false;

      const qStatus = q.status === null ? 'omitted' : (q.status || 'unused');

      

      if (activeFilters.includes("Unused") && qStatus === "unused") statusMatch = true;

      if (activeFilters.includes("Incorrect") && qStatus === "incorrect") statusMatch = true;

      if (activeFilters.includes("Marked") && q.isMarked) statusMatch = true;

      if (activeFilters.includes("Omitted") && qStatus === "omitted") statusMatch = true;

      if (activeFilters.includes("Correct") && qStatus === "correct") statusMatch = true;



      return statusMatch;

    });

  }, [questions, activeFilters]);



  // Final Pool after applying Subject and System filters

  const selectedPool = useMemo(() => {

    if (selectedSubjects.length === 0 || selectedSystems.length === 0) return [];

    return getFilteredQuestions.filter(q => {

      return selectedSubjects.includes(q.subject) && selectedSystems.includes(q.system);

    });

  }, [getFilteredQuestions, selectedSubjects, selectedSystems]);



  const maxAllowed = Math.min(selectedPool.length, 40);

  const isFormValid = selectedSubjects.length > 0 && selectedSystems.length > 0 && numQuestions > 0 && numQuestions <= maxAllowed;



  function handleStartTest() {

    if (!isFormValid) return;

    if (selectedPool.length === 0) {

      alert("No questions found matching your selection.");

      return;

    }

    const shuffled = [...selectedPool].sort(() => 0.5 - Math.random());

    const finalSet = shuffled.slice(0, numQuestions).map(q => q.id);

    // Generate or retrieve unique testId from session storage
    const userId = localStorage.getItem("medbank_user");
    let testId = sessionStorage.getItem('current_test_id');
    
    if (!testId) {
      // Generate new testId only if not exists, scoped by userId
      testId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('current_test_id', testId);
    } else {
      // Verify the testId belongs to current user
      if (!testId.startsWith(userId + '_')) {
        // Generate new testId if it belongs to different user
        testId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('current_test_id', testId);
      }
    }

    async function initiateTest() {

      const packageId = localStorage.getItem("medbank_selected_package");

      const packageName = localStorage.getItem("medbank_selected_package_name") || "Unknown Product";

      

      const selectedProduct = packageId ? { id: packageId, name: packageName } : null;

      if (!selectedProduct) {

        alert("No product selected. Please refresh the page.");

        throw new Error("No product selected for test creation");

      }

      

      console.log("Test creation and stats now fully scoped to product:", selectedProduct.id);

      

      const history = await getAllTests(packageId);

      const testNumber = history.length + 1;

      const testPayload = {

        testId, // Use the persistent testId

        testNumber,

        userId,

        packageId,

        packageName,

        questions: finalSet,

        mode,

        pool: activeFilters,

        date: new Date().toISOString(),

        universeSize: questions.length,

        eligiblePoolSize: selectedPool.length,

        poolLogic: {

          systems: selectedSystems,

          subjects: selectedSubjects,

          usageState: activeFilters.length > 0 ? activeFilters[0].toLowerCase() : "all"

        }

      };

      const saved = await saveTest(testPayload);

      const testAttemptId = saved?.testAttemptId || saved?.latestAttemptId || testPayload.testAttemptId || null;

      const persisted = {

        ...testPayload,

        ...(saved || {}),

        testAttemptId

      };

      localStorage.setItem("medbank_current_test", JSON.stringify(persisted));

      router.push("/student/qbank/take-test");

    }

    initiateTest();

  }



  const toggleSubject = (s) => {

    const count = questions.filter(q => q.subject === s && getFilteredQuestions.includes(q)).length;

    if (count === 0) return;

    setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  };



  const toggleSystem = (s) => {

    const count = questions.filter(q => q.system === s && getFilteredQuestions.includes(q)).length;

    if (count === 0) return;

    setSelectedSystems(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  };



  const toggleFilter = (f) => {

    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  };



  const subjectCounts = useMemo(() => {

    const counts = {};

    subjectOptions.forEach(s => { counts[s] = 0; });



    // Hierarchy Level 1: Filter questions by selected Modes

    const modeFiltered = (activeFilters.length === 0) ? [] : getFilteredQuestions;



    modeFiltered.forEach(q => {

      if (!q.subject) return;

      counts[q.subject] = (counts[q.subject] || 0) + 1;

    });



    return counts;

  }, [getFilteredQuestions, subjectOptions, activeFilters]);



  const systemCounts = useMemo(() => {

    const counts = {};

    systemOptions.forEach(s => { counts[s] = 0; });



    // Hierarchy Level 2: Filter questions by selected Modes AND selected Subjects

    if (activeFilters.length === 0 || selectedSubjects.length === 0) return counts;



    const subjectFiltered = getFilteredQuestions.filter(q => selectedSubjects.includes(q.subject));



    subjectFiltered.forEach(q => {

      if (!q.system) return;

      counts[q.system] = (counts[q.system] || 0) + 1;

    });



    return counts;

  }, [getFilteredQuestions, systemOptions, selectedSubjects, activeFilters]);



  const isTemplateB = productConfig?.templateType === 'ECG';



  const handleTemplateBSubjectClickWithoutPool = () => {

    if (!isTemplateB) return false;

    if (activeFilters.length > 0) return false;

    setShowSubjectWarning(true);

    window.clearTimeout(handleTemplateBSubjectClickWithoutPool._t);

    handleTemplateBSubjectClickWithoutPool._t = window.setTimeout(() => setShowSubjectWarning(false), 2500);

    return true;

  };



  const SubjectsBlock = (

    <div className="border-b border-zinc-800/50">

      <div

        className="flex items-center justify-between py-3 cursor-pointer group"

        onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}

      >

        <div className="flex items-center gap-2">

          <div

            onClick={(e) => {

              e.stopPropagation();

              if (handleTemplateBSubjectClickWithoutPool()) return;

              const selectable = subjectOptions.filter(s => (subjectCounts[s] || 0) > 0);

              setSelectedSubjects(selectedSubjects.length === selectable.length && selectable.length > 0 ? [] : selectable);

            }}

            className={`w-4 h-4 rounded border flex items-center justify-center transition-all mr-2 ${selectedSubjects.length > 0 && selectedSubjects.every(s => (subjectCounts[s] || 0) > 0) ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-transparent border-zinc-700 group-hover:border-zinc-500"}`}

          >

            {selectedSubjects.length > 0 && selectedSubjects.every(s => (subjectCounts[s] || 0) > 0) && <Check size={10} className="text-white" strokeWidth={4} />}

          </div>

          <h2 className="text-[14px] font-bold text-zinc-300">Subjects</h2>

          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">(Select All)</span>

          {isTemplateB && showSubjectWarning && (

            <span className="text-[11px] text-amber-400 font-medium ml-2">

              Choose a question pool first (Unused / Incorrect / Marked / Omitted / Correct)

            </span>

          )}

        </div>

        {isSubjectsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

      </div>

      {isSubjectsOpen && (

        <div className="pb-8 grid grid-cols-2 gap-x-20 gap-y-2">

          {subjectOptions.map(s => {

            const count = subjectCounts[s] || 0;

            const isDisabled = count === 0 && !selectedSubjects.includes(s);

            return (

              <label key={s} className={`flex items-center gap-2 ${isDisabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer group'}`}>

                <div

                  onClick={() => {

                    if (handleTemplateBSubjectClickWithoutPool()) return;

                    if (!isDisabled) toggleSubject(s);

                  }}

                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedSubjects.includes(s) ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-transparent border-zinc-700 group-hover:border-zinc-500"}`}

                >

                  {selectedSubjects.includes(s) && <Check size={10} className="text-white" strokeWidth={4} />}

                </div>

                <span className={`text-[12px] ${selectedSubjects.includes(s) ? "text-zinc-300" : "text-zinc-500"}`}>{s}</span>

                <div className="px-1.5 py-0.5 bg-zinc-800/30 rounded-full text-[10px] text-zinc-600 font-bold">{count}</div>

              </label>

            );

          })}

        </div>

      )}

    </div>

  );



  const SystemsBlock = (

    <div className={`border-b border-zinc-800/50 ${(!isTemplateB && selectedSubjects.length === 0) ? 'opacity-40 grayscale pointer-events-none' : ''}`}>

      <div

        className="flex items-center justify-between py-3 cursor-pointer group"

        onClick={() => selectedSubjects.length > 0 && setIsSystemsOpen(!isSystemsOpen)}

      >

        <div className="flex items-center gap-2">

          {!isTemplateB && (

            <div

              onClick={(e) => {

                e.stopPropagation();

                const selectable = systemOptions.filter(s => (systemCounts[s] || 0) > 0);

                setSelectedSystems(selectedSystems.length === selectable.length && selectable.length > 0 ? [] : selectable);

              }}

              className={`w-4 h-4 rounded border flex items-center justify-center transition-all mr-2 ${selectedSystems.length > 0 && selectedSystems.every(s => (systemCounts[s] || 0) > 0) ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-transparent border-zinc-700 group-hover:border-zinc-500"}`}

            >

              {selectedSystems.length > 0 && selectedSystems.every(s => (systemCounts[s] || 0) > 0) && <Check size={10} className="text-white" strokeWidth={4} />}

            </div>

          )}

          {!isTemplateB && <h2 className="text-[14px] font-bold text-zinc-300">Systems</h2>}

          {!isTemplateB && <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">(Select All)</span>}

        </div>

        <div className="flex items-center gap-4">

          {isSystemsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

        </div>

      </div>

      {isSystemsOpen && (

        <div className="pb-8 grid grid-cols-2 gap-x-20 gap-y-2">

          {systemOptions.map(s => {

            const count = systemCounts[s] || 0;

            const isDisabled = count === 0 && !selectedSystems.includes(s);

            return (

              <label key={s} className={`flex items-center ${isTemplateB ? 'justify-center text-center py-1.5' : 'justify-between'} group pr-2 rounded transition-colors ${isDisabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.02]'}`}>

                <div className={`flex items-center gap-2 ${isTemplateB ? 'justify-center w-full' : ''}`}>

                  {!isTemplateB && (

                    <div

                      onClick={() => !isDisabled && toggleSystem(s)}

                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedSystems.includes(s) ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-transparent border-zinc-700 group-hover:border-zinc-500"}`}

                    >

                      {selectedSystems.includes(s) && <Check size={10} className="text-white" strokeWidth={4} />}

                    </div>

                  )}

                  <span className={`${isTemplateB ? 'text-[11px] font-bold tracking-[0.08em] uppercase' : 'text-[12px]'} ${selectedSystems.includes(s) ? "text-zinc-200" : "text-zinc-500"}`}>{s}</span>

                  {!isTemplateB && <div className="px-1.5 py-0.5 bg-zinc-800/30 rounded-full text-[10px] text-zinc-600 font-bold">{count}</div>}

                </div>

                {!isTemplateB && !isDisabled && <Plus size={12} className="text-zinc-700 group-hover:text-zinc-500" />}

              </label>

            );

          })}

        </div>

      )}

    </div>

  );



  return (

    <div className="min-h-screen bg-background text-foreground font-sans select-none overflow-x-hidden">

      <div className="max-w-[1600px] mx-auto px-4 py-6 flex flex-col gap-1">

        {/* Always show the test creation interface; questions may load asynchronously */}

        {/* TEST MODE */}

        <div className="border-b border-zinc-800/50">

          <div

            className="flex items-center justify-between py-3 cursor-pointer group"

            onClick={() => setIsTestModeOpen(!isTestModeOpen)}

          >

            <div className="flex items-center gap-2">

              <h2 className="text-[14px] font-bold text-zinc-300">Test Mode</h2>

              <Info size={14} className="text-[#3b82f6]" />

            </div>

            {isTestModeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

          </div>

          {isTestModeOpen && (

            <div className="pb-6">

              <div className="flex bg-zinc-900/50 border border-zinc-800 p-1 rounded-full w-fit">

                {["tutor", "timed"].map(m => (

                  <button

                    key={m}

                    onClick={() => setMode(m)}

                    className={`px-8 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all ${mode === m ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-400'}`}

                  >

                    {m}

                    {m === "timed" && <Clock size={12} className="inline ml-2 mb-0.5" />}

                  </button>

                ))}

              </div>

            </div>

          )}

        </div>



        {/* QUESTION MODE */}

        <div className="border-b border-zinc-800/50">

          <div

            className="flex items-center justify-between py-3 cursor-pointer group"

            onClick={() => setIsQuestionModeOpen(!isQuestionModeOpen)}

          >

            <div className="flex items-center gap-3">

              <h2 className="text-[14px] font-bold text-zinc-300">Question Mode</h2>

              <div className="relative group/tooltip">

                <Info size={14} className="text-[#3b82f6] cursor-help" />



                {/* UWorld Style Tooltip */}

                <div className="absolute left-0 top-full mt-2 w-[480px] bg-[#16161a] border border-zinc-800 rounded shadow-2xl p-1 z-[100] opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">

                  <table className="w-full text-[12px] border-collapse">

                    <tbody>

                      <tr className="border-b border-zinc-800/50">

                        <td className="p-3 font-bold text-zinc-200 w-[100px]">Unused</td>

                        <td className="p-3 text-zinc-400">Selects questions from a set of new/unseen questions</td>

                      </tr>

                      <tr className="border-b border-zinc-800/50">

                        <td className="p-3 font-bold text-zinc-200">Incorrect</td>

                        <td className="p-3 text-zinc-400">Selects questions that were previously answered incorrectly</td>

                      </tr>

                      <tr className="border-b border-zinc-800/50">

                        <td className="p-3 font-bold text-zinc-200">Marked</td>

                        <td className="p-3 text-zinc-400">Selects questions that were previously marked/flagged for review</td>

                      </tr>

                      <tr className="border-b border-zinc-800/50">

                        <td className="p-3 font-bold text-zinc-200">Omitted</td>

                        <td className="p-3 text-zinc-400">Selects questions that were omitted previously</td>

                      </tr>

                      <tr>

                        <td className="p-3 font-bold text-zinc-200">Correct</td>

                        <td className="p-3 text-zinc-400">Selects questions that were previously answered correctly</td>

                      </tr>

                    </tbody>

                  </table>

                </div>

              </div>



              <div className="flex items-center gap-1.5 ml-2">

                <span className="text-[10px] uppercase font-bold text-zinc-500">Total Available</span>

                <div className="px-2 py-0.5 bg-zinc-800/80 rounded-full text-[10px] font-black text-[#3b82f6]">

                  {questions.length}

                </div>

              </div>

            </div>

            {isQuestionModeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

          </div>

          {isQuestionModeOpen && (

            <div className="pb-6 flex flex-col gap-6">

              <div className="flex gap-2">

                {["Standard", "Custom"].map(qm => (

                  <button

                    key={qm}

                    onClick={() => setQuestionMode(qm)}

                    className={`px-4 py-1 rounded-full text-[11px] font-bold transition-all border ${questionMode === qm ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-zinc-900 border-zinc-800 text-zinc-500"

                      }`}

                  >

                    {qm}

                  </button>

                ))}

              </div>

              <div className="flex items-center gap-8">

                {STATUS_FILTERS.map(f => {

                  const count = filterCounts[f];

                  const isDisabled = count === 0;

                  const isActive = activeFilters.includes(f);



                  return (

                    <label key={f} className={`flex items-center gap-2 ${isDisabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer group'}`}>

                      <div

                        onClick={() => !isDisabled && toggleFilter(f)}

                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isActive ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-transparent border-zinc-700 group-hover:border-zinc-500"}`}

                      >

                        {isActive && <Check size={10} className="text-white" strokeWidth={4} />}

                      </div>

                      <span className={`text-[12px] font-medium ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>

                        {f}

                      </span>

                      <div className="px-1.5 py-0.5 bg-zinc-800/50 rounded-full text-[10px] font-bold text-zinc-500">

                        {count}

                      </div>

                    </label>

                  );

                })}

              </div>

            </div>

          )}

        </div>



        {isTemplateB ? (

          <>

            {SystemsBlock}

            {SubjectsBlock}

          </>

        ) : (

          <>

            {SubjectsBlock}

            {SystemsBlock}

          </>

        )}



        {/* NO. OF QUESTIONS */}

        <div className="">

          <div

            className="flex items-center justify-between py-3 cursor-pointer group"

            onClick={() => setIsNoQuestionsOpen(!isNoQuestionsOpen)}

          >

            <h2 className="text-[14px] font-bold text-zinc-300">No. of Questions</h2>

            {isNoQuestionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}

          </div>

          {isNoQuestionsOpen && (

            <div className="pb-8 flex flex-col gap-6">

              <div className="flex items-center gap-6">

                <input

                  type="number"

                  min={1}

                  max={maxAllowed}

                  value={numQuestions || ""}

                  onChange={e => {

                    let v = parseInt(e.target.value);

                    if (isNaN(v)) v = 0;

                    else if (v > maxAllowed) v = maxAllowed;

                    setNumQuestions(v);

                  }}

                  className="w-[50px] h-[35px] border border-zinc-700 bg-black/40 rounded text-[15px] font-bold text-zinc-100 text-center focus:border-[#3b82f6] outline-none transition-all"

                />

                <div className="flex items-center gap-3">

                  <span className="text-[12px] text-zinc-500">Max allowed per block</span>

                  <div className="px-2 py-0.5 bg-zinc-800/60 rounded-full text-[10px] font-black text-[#3b82f6]">

                    {maxAllowed}

                  </div>

                </div>

              </div>



              <div className="flex items-center gap-4 mt-4">

                <button

                  onClick={handleStartTest}

                  disabled={!isFormValid}

                  className={`px-10 py-3 rounded font-bold uppercase tracking-wider text-[13px] transition-all shadow-lg ${isFormValid

                    ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white active:scale-[0.98] shadow-blue-500/20'

                    : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'

                    }`}

                >

                  GENERATE TEST

                </button>

                {!isFormValid && (

                  <div className="group relative">

                    <Info size={20} className="text-zinc-600 hover:text-zinc-400 cursor-help" />

                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-64 bg-zinc-900 border border-zinc-800 text-white text-[11px] p-4 rounded bg-[#16161a] opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl z-50">

                      <p className="font-bold mb-2 uppercase tracking-widest text-[#3b82f6]">Requirements:</p>

                      <ul className="space-y-1.5 text-zinc-400 font-medium">

                        <li className={selectedSubjects.length > 0 ? "text-green-400" : ""}>• Select at least 1 Subject</li>

                        <li className={selectedSystems.length > 0 ? "text-green-400" : ""}>• Select at least 1 System</li>

                        <li className={numQuestions > 0 ? "text-green-400" : ""}>• Enter number of questions</li>

                      </ul>

                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[#16161a]" />

                    </div>

                  </div>

                )}

              </div>

            </div>

          )}

        </div>



      </div>

    </div>

  );

}

