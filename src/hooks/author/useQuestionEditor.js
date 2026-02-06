"use client";

import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addQuestion, getQuestionById, updateQuestion } from "@/services/question.service";
import Question from "@/models/question.model";
import { AppContext } from "@/context/AppContext";

/* ---------- Helpers ---------- */
export function imageSizeClass(size) {
  if (size === "small") return "max-w-240 mx-auto rounded border mt-3 block";
  if (size === "medium") return "max-w-480 mx-auto rounded border mt-3 block";
  if (size === "large") return "max-w-720 mx-auto rounded border mt-3 block";
  return "max-w-full mx-auto rounded border mt-3 block";
}

export function fileToBase64(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => callback(reader.result);
  reader.readAsDataURL(file);
}

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useAutoResizeTextarea(value) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return ref;
}

export function useQuestionEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedAuthorProduct } = useContext(AppContext);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});

  const [questionId, setQuestionId] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [status, setStatus] = useState("draft");
  const [originalCreatedAt, setOriginalCreatedAt] = useState(Date.now());
  const [version, setVersion] = useState(1);
  const [lastSaved, setLastSaved] = useState(null);

  // Meta
  const [system, setSystem] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [packageId, setPackageId] = useState("");

  // Content
  const [stem, setStem] = useState("");
  const [stemImage, setStemImage] = useState({ data: "", size: "default", fileName: "" });
  const [choices, setChoices] = useState(
    Array(5).fill().map(() => ({ text: "", image: { data: "", size: "default", fileName: "" } }))
  );
  const [correctIndex, setCorrectIndex] = useState(0);

  // Explanations
  const [explanationCorrect, setExplanationCorrect] = useState("");
  const [explanationCorrectImage, setExplanationCorrectImage] = useState({ data: "", size: "default", fileName: "" });
  const [explanationWrong, setExplanationWrong] = useState("");
  const [explanationWrongImage, setExplanationWrongImage] = useState({ data: "", size: "default", fileName: "" });
  const [summary, setSummary] = useState("");
  const [summaryImage, setSummaryImage] = useState({ data: "", size: "default", fileName: "" });

  const [stemImageMode, setStemImageMode] = useState("auto");
  const [explanationImageMode, setExplanationImageMode] = useState("auto");
  const [references, setReferences] = useState("");
  const [tags, setTags] = useState("");

  // Auto-suggest
  const [suggestion, setSuggestion] = useState(null);
  const [activeField, setActiveField] = useState(null);

  // Taxonomy
  const STANDARD_SYSTEMS = [
    "Cardiovascular", "Respiratory", "Renal", "Gastrointestinal", "Neurology",
    "Musculoskeletal", "Endocrine", "Reproductive", "Hematology", "Dermatology", "Psychiatry", "Multisystem"
  ];
  const STANDARD_SUBJECTS = [
    "Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology",
    "Microbiology", "Immunology", "Behavioral Science", "Genetics", "Biostatistics", "Epidemiology"
  ];
  const [availableSystems, setAvailableSystems] = useState(STANDARD_SYSTEMS);
  const [availableSubjects, setAvailableSubjects] = useState(STANDARD_SUBJECTS);

  useEffect(() => {
    if (selectedAuthorProduct) {
      setAvailableSystems(selectedAuthorProduct.systems?.length > 0 ? selectedAuthorProduct.systems : STANDARD_SYSTEMS);
      setAvailableSubjects(selectedAuthorProduct.subjects?.length > 0 ? selectedAuthorProduct.subjects : STANDARD_SUBJECTS);
      setPackageId(selectedAuthorProduct.id.toString());
    }
  }, [selectedAuthorProduct]);

  useEffect(() => {
    // Legacy Password Check Removed: Authorization now handled by AuthorLayout
    setIsAuthorized(true);
    setSystem(localStorage.getItem("author-system") || "");
    setSubject(localStorage.getItem("author-subject") || "");
  }, [router]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const q = await getQuestionById(id);
        if (!q) {
          router.push("/author/manage-questions");
          return;
        }
        setIsEditing(true);
        setQuestionId(q.id);
        setConceptId(q.conceptId || "");
        setStatus(q.status || "draft");
        setOriginalCreatedAt(q.createdAt || Date.now());
        setTopic(q.topic || "");
        setStem(q.stem || "");
        setStemImage(q.stemImage || { data: "", size: "default", fileName: "" });
        setSystem(q.system || "");
        setSubject(q.subject || "");
        setStemImageMode(q.stemImageMode || "auto");
        setExplanationImageMode(q.explanationImageMode || "auto");
        const loadedChoices = (q.choices || []).map(ch => ({
          text: ch.text || "",
          image: ch.image || { data: "", size: "default", fileName: "" }
        }));
        while (loadedChoices.length < 5) loadedChoices.push({ text: "", image: { data: "", size: "default", fileName: "" } });
        setChoices(loadedChoices.slice(0, 5));
        setCorrectIndex(q.correct ? q.correct.charCodeAt(0) - 65 : 0);
        setExplanationCorrect(q.explanationCorrect || "");
        setExplanationCorrectImage(q.explanationCorrectImage || { data: "", size: "default", fileName: "" });
        setExplanationWrong(q.explanationWrong || "");
        setExplanationWrongImage(q.explanationWrongImage || { data: "", size: "default", fileName: "" });
        setSummary(q.summary || "");
        setSummaryImage(q.summaryImage || { data: "", size: "default", fileName: "" });
        setReferences(q.references || "");
        setTags(Array.isArray(q.tags) ? q.tags.join(", ") : "");
        setPackageId(q.packageId || "");
        setVersion(q.versionNumber || 1);
      } catch (err) {
        setLoadError("Failed to load question");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, router]);

  useEffect(() => { localStorage.setItem("author-system", system); }, [system]);
  useEffect(() => { localStorage.setItem("author-subject", subject); }, [subject]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!questionId.trim()) newErrors.questionId = "Question ID required";
    if (!stem.trim()) newErrors.stem = "Question stem required";
    if (!system.trim()) newErrors.system = "System required";
    if (!subject.trim()) newErrors.subject = "Subject required";
    if (!selectedAuthorProduct) newErrors.product = "Product must be selected";
    choices.forEach((c, i) => {
      if (!c.text.trim()) newErrors[`choice${i}`] = `Choice ${String.fromCharCode(65 + i)} required`;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [questionId, stem, system, subject, choices, selectedAuthorProduct]);

  const saveQuestion = useCallback(async (shouldPublish = false) => {
    const isValid = validate();
    if (!isValid) {
      console.log("Validation errors:", errors);
      alert("Please fix the highlighted errors first.");
      return;
    }

    if (isEditing && status !== 'draft') {
        alert("IMMUTABLE ERROR: This version is published. Please use 'Revise' from the management panel.");
        return;
    }

    const action = shouldPublish ? "publish" : "save draft";
    if (!confirm(`Are you sure you want to ${action}?`)) return;

    console.log("Saving question with data:", {
      questionId,
      system,
      subject,
      topic,
      selectedAuthorProduct,
      packageId: selectedAuthorProduct ? selectedAuthorProduct.id : packageId
    });

    const q = {
      id: questionId,
      conceptId: conceptId || null,
      stem,
      stemImage,
      choices: choices.map((c, i) => ({
        id: String.fromCharCode(65 + i),
        text: c.text,
        image: c.image
      })),
      correct: String.fromCharCode(65 + correctIndex),
      explanationCorrect,
      explanationCorrectImage,
      explanationWrong,
      explanationWrongImage,
      summary,
      summaryImage,
      system,
      subject,
      topic: topic.trim() || "Mixed",
      status: shouldPublish ? 'published' : 'draft',
      published: shouldPublish ? 1 : 0,
      stemImageMode,
      explanationImageMode,
      createdAt: isEditing ? originalCreatedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: "multiple-choice",
      references,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      versionNumber: version,
      packageId: selectedAuthorProduct ? parseInt(selectedAuthorProduct.id) : (packageId ? parseInt(packageId) : null),
      productId: selectedAuthorProduct ? parseInt(selectedAuthorProduct.id) : (packageId ? parseInt(packageId) : null)
    };

    try {
      setLoading(true);
      let resultId = questionId;
      if (isEditing) {
        await updateQuestion(q);
      } else {
        const created = await addQuestion(q);
        resultId = created.id;
      }

      if (shouldPublish) {
        alert("Published successfully!");
        router.push("/author/manage-questions");
      } else {
        setLastSaved(Date.now());
        alert("Draft saved!");
        if (!isEditing) router.push(`/author/create-question?id=${resultId}`);
      }
    } catch (err) {
      console.error("Save error details:", err);
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [validate, errors, isEditing, status, version, questionId, conceptId, stem, stemImage, choices, correctIndex, explanationCorrect, explanationCorrectImage, explanationWrong, explanationWrongImage, summary, summaryImage, system, subject, topic, stemImageMode, explanationImageMode, originalCreatedAt, references, tags, selectedAuthorProduct, packageId, router]);

  const resetForm = useCallback(() => {
    setQuestionId("");
    setConceptId("");
    setStatus("draft");
    setTopic("");
    setStem("");
    setStemImage({ data: "", size: "default", fileName: "" });
    setChoices(Array(5).fill().map(() => ({ text: "", image: { data: "", size: "default", fileName: "" } })));
    setCorrectIndex(0);
    setExplanationCorrect("");
    setExplanationCorrectImage({ data: "", size: "default", fileName: "" });
    setExplanationWrong("");
    setExplanationWrongImage({ data: "", size: "default", fileName: "" });
    setSummary("");
    setSummaryImage({ data: "", size: "default", fileName: "" });
    setReferences("");
    setTags("");
    setVersion(1);
    setLastSaved(null);
  }, []);

  const generateAutoId = useCallback(() => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setQuestionId(random);
  }, []);

  const handleImageChange = useCallback((setter, current) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToBase64(file, (img) => setter({ ...current, data: img, fileName: file.name }));
  }, []);

  const handleTextareaChange = useCallback((setter, fieldName) => (e) => {
    const value = e.target.value;
    setter(value);
    const pos = e.target.selectionStart;
    const textBefore = value.slice(0, pos);
    const openBracket = textBefore.lastIndexOf('[');
    const closeBracket = textBefore.lastIndexOf(']');
    if (openBracket > closeBracket && pos - openBracket < 40) {
      let suggestedKey = "";
      if (fieldName === "stem") suggestedKey = "stem-image";
      else if (fieldName === "correct") suggestedKey = "correct-image";
      else if (fieldName === "wrong") suggestedKey = "wrong-image";
      else if (fieldName === "summary") suggestedKey = "summary-image";
      const inside = textBefore.slice(openBracket + 1);
      setSuggestion(`[${inside}|${suggestedKey}]`);
      setActiveField(fieldName);
    } else {
      setSuggestion(null);
      setActiveField(null);
    }
  }, []);

  const handleKeyDownSuggested = useCallback((e, setter, textareaRef) => {
    if ((e.key === "Tab" || e.key === "Enter") && suggestion && activeField) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart;
      const textBefore = textarea.value.slice(0, pos);
      const openIndex = textBefore.lastIndexOf('[');
      if (openIndex !== -1) {
        const newValue = textarea.value.slice(0, openIndex) + suggestion + textarea.value.slice(pos);
        setter(newValue);
        setTimeout(() => {
          textarea.focus();
          const newPos = openIndex + suggestion.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
      setSuggestion(null);
      setActiveField(null);
    }
  }, [suggestion, activeField]);

  return {
    isAuthorized, isEditing, loading, loadError, errors,
    questionId, setQuestionId, originalCreatedAt, version, lastSaved,
    status, conceptId,
    system, setSystem, subject, setSubject, topic, setTopic, packageId,
    stem, setStem, stemImage, setStemImage,
    choices, setChoices, correctIndex, setCorrectIndex,
    explanationCorrect, setExplanationCorrect, explanationCorrectImage, setExplanationCorrectImage,
    explanationWrong, setExplanationWrong, explanationWrongImage, setExplanationWrongImage,
    summary, setSummary, summaryImage, setSummaryImage,
    stemImageMode, setStemImageMode, explanationImageMode, setExplanationImageMode,
    references, setReferences, tags, setTags,
    suggestion, activeField, availableSystems, availableSubjects,
    saveQuestion, resetForm, generateAutoId, handleImageChange, handleTextareaChange, handleKeyDownSuggested
  };
}
