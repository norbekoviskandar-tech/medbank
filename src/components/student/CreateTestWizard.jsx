"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllQuestions } from "@/services/question.service";
import { useRouter } from "next/navigation";

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology",
  "Microbiology", "Immunology", "Behavioral Science", "Genetics", "Biostatistics", "Epidemiology"
];

const SYSTEMS = [
  "Cardiovascular", "Respiratory", "Renal", "Gastrointestinal", "Neurology",
  "Musculoskeletal", "Endocrine", "Reproductive", "Hematology", "Dermatology", "Psychiatry", "Multisystem"
];

export default function CreateTestPage() {
  const [questions, setQuestions] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [mode, setMode] = useState("tutor"); 
  const [numQuestions, setNumQuestions] = useState(10);
  const [activeFilters, setActiveFilters] = useState(["Unused"]); // Matches your requirement
  const [qStatus, setQStatus] = useState({}); // { questionId: { status, isMarked } }
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(true);
  const [isSystemsExpanded, setIsSystemsExpanded] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const userId = localStorage.getItem("medbank_user");
      const statsKey = `medbank_qbank_stats_${userId}`;
      const [allQs, stats] = await Promise.all([
        getAllQuestions(),
        JSON.parse(localStorage.getItem(statsKey) || "{}")
      ]);
      setQuestions(allQs.filter(q => q.published));
      setQStatus(stats);
    }
    fetchData();
  }, []);

  const getFilteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const stats = qStatus[q.id] || { status: "unused", isMarked: false };
      
      // Filter logic based on checked boxes
      const isUnused = stats.status === "unused" && activeFilters.includes("Unused");
      const isIncorrect = stats.status === "incorrect" && activeFilters.includes("Incorrect");
      const isMarked = stats.isMarked && activeFilters.includes("Marked");
      const isOmitted = stats.status === "omitted" && activeFilters.includes("Omitted");
      const isCorrect = stats.status === "correct" && activeFilters.includes("Correct");

      return isUnused || isIncorrect || isMarked || isOmitted || isCorrect;
    });
  }, [questions, qStatus, activeFilters]);

  // Pool matches based on Subject, System, or both (Exclusive selection not required)
  const selectedPool = useMemo(() => {
    const hasSubjects = selectedSubjects.length > 0;
    const hasSystems = selectedSystems.length > 0;

    // If nothing is selected in either category, the pool is empty
    if (!hasSubjects && !hasSystems) return [];

    return getFilteredQuestions.filter(q => {
      // If subjects are selected, match them. If not, don't block (allow all subjects).
      const subjectMatch = !hasSubjects || selectedSubjects.includes(q.subject);
      
      // If systems are selected, match them. If not, don't block (allow all systems).
      const systemMatch = !hasSystems || selectedSystems.includes(q.system);
      
      // Intersection logic: if both are selected, must match both. 
      // If only one is selected, acts as a primary filter.
      return subjectMatch && systemMatch;
    });
  }, [getFilteredQuestions, selectedSubjects, selectedSystems]);

  const handleToggleFilter = (label) => {
    if (filterCounts[label] === 0) return;
    setActiveFilters(prev => 
      prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
    );
  };

  function handleStartTest() {
    if (selectedPool.length === 0) {
      alert("No questions found matching your selection of Subjects, Systems, and Question Modes.");
      return;
    }

    if (numQuestions > selectedPool.length) {
      alert(`Error: You requested ${numQuestions} questions, but only ${selectedPool.length} match your criteria. Please reduce the count or expand filters.`);
      return;
    }

    const shuffled = [...selectedPool].sort(() => 0.5 - Math.random());
    const finalSet = shuffled.slice(0, numQuestions).map(q => q.id);

    localStorage.setItem("medbank_current_test", JSON.stringify({
      questions: finalSet,
      mode,
      startTime: new Date().toISOString()
    }));

    router.push("/app/qbank/take-test");
  }

  const handleSelectAllSubjects = (checked) => {
    if (!checked) {
      setSelectedSubjects([]);
      return;
    }
    const availableSubjects = SUBJECTS.filter(subject => 
      getFilteredQuestions.some(q => q.subject === subject)
    );
    setSelectedSubjects(availableSubjects);
  };

  const handleSelectAllSystems = (checked) => {
    if (!checked) {
      setSelectedSystems([]);
      return;
    }
    const availableSystems = SYSTEMS.filter(system => 
      getFilteredQuestions.some(q => q.system === system)
    );
    setSelectedSystems(availableSystems);
  };

  const areAllSubjectsSelected = selectedSubjects.length === SUBJECTS.length;
  const areAllSystemsSelected = selectedSystems.length === SYSTEMS.length;

  // Real Stats for filters
  const filterCounts = useMemo(() => {
    const counts = { Unused: 0, Incorrect: 0, Marked: 0, Omitted: 0, Correct: 0 };
    questions.forEach(q => {
      const stats = qStatus[q.id] || { status: "unused", isMarked: false };
      if (stats.status === "unused") counts.Unused++;
      if (stats.status === "incorrect") counts.Incorrect++;
      if (stats.isMarked) counts.Marked++;
      if (stats.status === "omitted") counts.Omitted++;
      if (stats.status === "correct") counts.Correct++;
    });
    return counts;
  }, [questions, qStatus]);

  return (
    <div className="max-w-[1200px] mx-auto bg-white min-h-screen shadow-sm border border-zinc-200">
      
      {/* Test Mode */}
      <section className="p-8 border-b border-zinc-100">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-bold text-zinc-700">Test Mode</span>
            <div className="flex bg-zinc-100 p-1 rounded-full">
              {["tutor", "timed"].map(m => (
                <button 
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-6 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${mode === m ? 'bg-[#004e92] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Question Mode / Filters */}
      <section className="p-8 border-b border-zinc-100">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <span className="text-[13px] font-bold text-zinc-700">Question Mode</span>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 border border-[#004e92] text-[#004e92] bg-blue-50/50 rounded text-[11px] font-bold uppercase tracking-tight">Standard</button>
              <button className="px-4 py-1.5 border border-zinc-200 text-zinc-400 rounded text-[11px] font-bold uppercase tracking-tight">Custom</button>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase ml-auto tracking-widest">Master Pool ({questions.length})</span>
          </div>

          <div className="flex gap-8">
            {Object.entries(filterCounts).map(([label, count]) => {
              const isDisabled = count === 0;
              const isActive = activeFilters.includes(label);
              return (
                <label 
                  key={label} 
                  className={`flex items-center gap-2 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer group'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={isActive && !isDisabled}
                    onChange={() => handleToggleFilter(label)}
                    disabled={isDisabled}
                    className="w-4 h-4 accent-[#004e92] border-zinc-200 rounded transition-all" 
                  />
                  <span className={`text-[12px] font-bold uppercase tracking-tighter ${
                    isDisabled ? 'text-zinc-400' : 
                    isActive ? 'text-[#004e92]' : 'text-zinc-600 group-hover:text-zinc-800'
                  }`}>
                    {label}
                  </span>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    isDisabled ? 'bg-zinc-50 text-zinc-300 border border-zinc-100' : 
                    isActive ? 'bg-[#004e92] text-white' : 'bg-blue-50 text-[#004e92]'
                  }`}>
                    {count}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="p-8 border-b border-zinc-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[13px] font-bold text-zinc-700 flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={areAllSubjectsSelected}
              onChange={(e) => handleSelectAllSubjects(e.target.checked)}
              className="w-4 h-4 accent-[#004e92] border-zinc-300 rounded cursor-pointer" 
            />
            Subjects
          </h3>
          <button 
            onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
            className="text-[10px] font-bold text-[#004e92] uppercase hover:underline tracking-widest"
          >
            {isSubjectsExpanded ? "- Collapse All" : "+ Expand All"}
          </button>
        </div>
        {isSubjectsExpanded && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-12 animate-in fade-in slide-in-from-top-2 duration-300">
          {SUBJECTS.map(subject => {
            const count = getFilteredQuestions.filter(q => q.subject === subject).length;
            const isSelected = selectedSubjects.includes(subject);
            const isDisabled = count === 0;
            return (
              <label key={subject} className={`flex items-center gap-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                <input 
                  type="checkbox" 
                  checked={isSelected && !isDisabled}
                  onChange={() => !isDisabled && setSelectedSubjects(pv => pv.includes(subject) ? pv.filter(s => s !== subject) : [...pv, subject])}
                  disabled={isDisabled}
                  className="w-4 h-4 accent-[#004e92] border-zinc-300 rounded"
                />
                <span className={`text-[12px] transition-colors ${
                  isDisabled ? 'text-zinc-400' :
                  isSelected ? 'text-[#004e92] font-bold' : 
                  'text-zinc-600 group-hover:text-zinc-800 font-medium'
                }`}>
                  {subject}
                </span>
                <div className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  isDisabled ? 'bg-zinc-50 text-zinc-300 border border-zinc-100' : 
                  isSelected ? 'bg-[#004e92] text-white' : 'bg-blue-50 text-[#004e92]'
                }`}>
                  {count}
                </div>
              </label>
            );
          })}
        </div>
        )}
      </section>

      {/* Systems */}
      <section className="p-8 border-b border-zinc-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[13px] font-bold text-zinc-700 flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={areAllSystemsSelected}
              onChange={(e) => handleSelectAllSystems(e.target.checked)}
              className="w-4 h-4 accent-[#004e92] border-zinc-300 rounded cursor-pointer" 
            />
            Systems
          </h3>
          <button 
            onClick={() => setIsSystemsExpanded(!isSystemsExpanded)}
            className="text-[10px] font-bold text-[#004e92] uppercase hover:underline tracking-widest"
          >
            {isSystemsExpanded ? "- Collapse All" : "+ Expand All"}
          </button>
        </div>
        {isSystemsExpanded && (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-y-4 gap-x-24 animate-in fade-in slide-in-from-top-2 duration-300">
          {SYSTEMS.map(system => {
            const count = getFilteredQuestions.filter(q => q.system === system).length;
            const isSelected = selectedSystems.includes(system);
            const isDisabled = count === 0;
            return (
              <label key={system} className={`flex items-center gap-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                <input 
                  type="checkbox" 
                  checked={isSelected && !isDisabled}
                  onChange={() => !isDisabled && setSelectedSystems(pv => pv.includes(system) ? pv.filter(s => s !== system) : [...pv, system])}
                  disabled={isDisabled}
                  className="w-4 h-4 accent-[#004e92] border-zinc-300 rounded"
                />
                <span className={`text-[12px] transition-colors ${
                  isDisabled ? 'text-zinc-400' :
                  isSelected ? 'text-[#004e92] font-bold' : 
                  'text-zinc-600 group-hover:text-zinc-800 font-medium'
                }`}>
                  {system}
                </span>
                <div className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  isDisabled ? 'bg-zinc-50 text-zinc-300 border border-zinc-100' : 
                  isSelected ? 'bg-[#004e92] text-white' : 'bg-blue-50 text-[#004e92]'
                }`}>
                  {count}
                </div>
              </label>
            );
          })}
        </div>
        )}
      </section>

      {/* Pool Footer */}
      <section className="p-8 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-black text-[#002b5c] uppercase tracking-wider">Number of Questions</h3>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              max={40}
              value={numQuestions}
              onChange={e => {
                let v = parseInt(e.target.value);
                if (isNaN(v)) v = "";
                else if (v > 40) v = 40;
                else if (v < 1) v = 1;
                setNumQuestions(v);
              }}
              onBlur={() => !numQuestions && setNumQuestions(1)}
              className="w-20 border-2 border-zinc-200 rounded-lg px-3 py-2 text-[16px] font-black text-[#002b5c] text-center focus:border-[#00bbd4] outline-none shadow-sm transition-all"
            />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">Max: 40 Questions / Block</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className="text-right">
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Target Match</span>
             <span className={`text-[20px] font-black leading-none ${selectedPool.length > 0 ? 'text-[#00bbd4]' : 'text-red-400'}`}>
               {selectedPool.length} <span className="text-[12px] text-zinc-400">Available</span>
             </span>
           </div>
           <button 
             onClick={handleStartTest}
             className="bg-[#00bbd4] hover:bg-[#00acc1] text-white px-12 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-cyan-900/10"
           >
             Generate Test
           </button>
        </div>
      </section>

    </div>
  );
}
