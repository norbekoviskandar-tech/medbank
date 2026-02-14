import { useMemo, useState } from "react";
import { SUBJECTS, SYSTEMS } from "@/utils/createTestHelpers";

export function useTestAssembly(questions) {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [numQuestions, setNumQuestions] = useState(0);
  const [mode, setMode] = useState("tutor");
  const [questionMode, setQuestionMode] = useState("Standard");

  const subjectOptions = useMemo(() => {
    const fromQuestions = questions.map((q) => q.subject).filter(Boolean);
    return [...new Set([...SUBJECTS, ...fromQuestions])].sort();
  }, [questions]);

  const systemOptions = useMemo(() => {
    const fromQuestions = questions.map((q) => q.system).filter(Boolean);
    return [...new Set([...SYSTEMS, ...fromQuestions])].sort();
  }, [questions]);

  const filterCounts = useMemo(() => {
    const counts = { Unused: 0, Incorrect: 0, Marked: 0, Omitted: 0, Correct: 0 };
    questions.forEach((q) => {
      const qStatus = q.status === null ? "omitted" : (q.status || "unused");
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
    return questions.filter((q) => {
      let statusMatch = false;
      const qStatus = q.status === null ? "omitted" : (q.status || "unused");
      if (activeFilters.includes("Unused") && qStatus === "unused") statusMatch = true;
      if (activeFilters.includes("Incorrect") && qStatus === "incorrect") statusMatch = true;
      if (activeFilters.includes("Marked") && q.isMarked) statusMatch = true;
      if (activeFilters.includes("Omitted") && qStatus === "omitted") statusMatch = true;
      if (activeFilters.includes("Correct") && qStatus === "correct") statusMatch = true;
      return statusMatch;
    });
  }, [questions, activeFilters]);

  const selectedPool = useMemo(() => {
    if (selectedSubjects.length === 0 || selectedSystems.length === 0) return [];
    return getFilteredQuestions.filter((q) => {
      return selectedSubjects.includes(q.subject) && selectedSystems.includes(q.system);
    });
  }, [getFilteredQuestions, selectedSubjects, selectedSystems]);

  const maxAllowed = Math.min(selectedPool.length, 40);
  const isFormValid = selectedSubjects.length > 0 && selectedSystems.length > 0 && numQuestions > 0 && numQuestions <= maxAllowed;

  const toggleSubject = (s) => {
    const count = questions.filter((q) => q.subject === s && getFilteredQuestions.includes(q)).length;
    if (count === 0) return;
    setSelectedSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleSystem = (s) => {
    const count = questions.filter((q) => q.system === s && getFilteredQuestions.includes(q)).length;
    if (count === 0) return;
    setSelectedSystems((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleFilter = (f) => {
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const subjectCounts = useMemo(() => {
    const counts = {};
    subjectOptions.forEach((s) => {
      counts[s] = 0;
    });
    if (activeFilters.length === 0) return counts;

    getFilteredQuestions.forEach((q) => {
      if (!q.subject) return;
      counts[q.subject] = (counts[q.subject] || 0) + 1;
    });
    return counts;
  }, [getFilteredQuestions, subjectOptions, activeFilters]);

  const systemCounts = useMemo(() => {
    const counts = {};
    systemOptions.forEach((s) => {
      counts[s] = 0;
    });
    if (activeFilters.length === 0 || selectedSubjects.length === 0) return counts;

    const subjectFiltered = getFilteredQuestions.filter((q) => selectedSubjects.includes(q.subject));
    subjectFiltered.forEach((q) => {
      if (!q.system) return;
      counts[q.system] = (counts[q.system] || 0) + 1;
    });
    return counts;
  }, [getFilteredQuestions, systemOptions, selectedSubjects, activeFilters]);

  return {
    selectedSubjects,
    setSelectedSubjects,
    selectedSystems,
    setSelectedSystems,
    activeFilters,
    setActiveFilters,
    numQuestions,
    setNumQuestions,
    mode,
    setMode,
    questionMode,
    setQuestionMode,
    subjectOptions,
    systemOptions,
    filterCounts,
    getFilteredQuestions,
    selectedPool,
    maxAllowed,
    isFormValid,
    toggleSubject,
    toggleSystem,
    toggleFilter,
    subjectCounts,
    systemCounts
  };
}
