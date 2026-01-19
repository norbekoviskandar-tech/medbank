"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addQuestion, getQuestionById, updateQuestion } from "@/services/question.service";
import Question from "@/models/question.model";

/* ---------- Helpers ---------- */
function imageSizeClass(size) {
  if (size === "small") return "max-w-240 mx-auto rounded border mt-3 block";
  if (size === "medium") return "max-w-480 mx-auto rounded border mt-3 block";
  if (size === "large") return "max-w-720 mx-auto rounded border mt-3 block";
  return "max-w-full mx-auto rounded border mt-3 block";
}

function fileToBase64(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/* ---------- Auto-resize hook ---------- */
function useAutoResizeTextarea(value) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return ref;
}

/* ---------- Component ---------- */
export default function CreateQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});

  const [questionId, setQuestionId] = useState("");
  const [originalCreatedAt, setOriginalCreatedAt] = useState(Date.now());
  const [lastSaved, setLastSaved] = useState(null);

  // Meta
  const [system, setSystem] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

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

  // Display modes
  const [stemImageMode, setStemImageMode] = useState("auto");
  const [explanationImageMode, setExplanationImageMode] = useState("auto");

  // Auto-suggest state
  const [suggestion, setSuggestion] = useState(null);
  const [activeField, setActiveField] = useState(null);

  // Refs
  const stemRef = useAutoResizeTextarea(stem);
  const expCorrectRef = useAutoResizeTextarea(explanationCorrect);
  const expWrongRef = useAutoResizeTextarea(explanationWrong);
  const summaryRef = useAutoResizeTextarea(summary);

  const stemTextareaRef = useRef(null);
  const expCorrectTextareaRef = useRef(null);
  const expWrongTextareaRef = useRef(null);
  const summaryTextareaRef = useRef(null);

  const systems = [
    "Cardiovascular", "Respiratory", "Renal", "Gastrointestinal", "Neurology",
    "Musculoskeletal", "Endocrine", "Reproductive", "Hematology", "Dermatology", "Psychiatry", "Multisystem"
  ];
  const subjects = [
    "Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology",
    "Microbiology", "Immunology", "Behavioral Science", "Genetics", "Biostatistics", "Epidemiology"
  ];

  // Auth check & Meta Load
  useEffect(() => {
    const unlocked = localStorage.getItem("medbank-author-unlocked");
    if (unlocked === "true") {
      setIsAuthorized(true);
      // Load meta from localStorage
      setSystem(localStorage.getItem("author-system") || "");
      setSubject(localStorage.getItem("author-subject") || "");
    } else {
      router.push("/author");
    }
  }, [router]);

  // Load question when editing
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;

    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const q = await getQuestionById(id);
        if (!q) {
          alert("Question not found");
          router.push("/author/create-question");
          return;
        }

        setIsEditing(true);
        setQuestionId(q.id);
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
      } catch (err) {
        console.error("Failed to load:", err);
        setLoadError("Failed to load question");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, router]);

  // LocalStorage sync
  useEffect(() => { localStorage.setItem("author-system", system); }, [system]);
  useEffect(() => { localStorage.setItem("author-subject", subject); }, [subject]);

  // Auto-save draft every 60 seconds
  useEffect(() => {
    if (!questionId.trim() && !stem.trim()) return;

    const timer = setInterval(() => {
      if (validate()) {
        saveQuestion(false);
        console.log("[Auto-save]", new Date().toLocaleTimeString());
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [questionId, stem, choices, explanationCorrect, explanationWrong, summary, system, subject, topic]);

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveQuestion(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!questionId.trim()) newErrors.questionId = "Question ID required";
    if (!stem.trim()) newErrors.stem = "Stem required";
    if (!system.trim()) newErrors.system = "System required";
    if (!subject.trim()) newErrors.subject = "Subject required";

    choices.forEach((c, i) => {
      if (!c.text.trim()) newErrors[`choice${i}`] = `Choice ${String.fromCharCode(65 + i)} required`;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveQuestion = async (publish = false) => {
    if (!validate()) {
      alert("Please fix the highlighted errors first.");
      return;
    }

    const action = publish ? "publish" : "save as draft";
    if (!confirm(`Are you sure you want to ${action} this question?`)) return;

    const q = new Question({
      id: questionId,
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
      topic,
      published: publish,
      stemImageMode,
      explanationImageMode,
      createdAt: isEditing ? originalCreatedAt : Date.now(),
      updatedAt: Date.now()
    });

    try {
      if (isEditing) {
        await updateQuestion(q);
      } else {
        await addQuestion(q);
      }
      setLastSaved(Date.now());
      alert(publish ? "Published successfully!" : "Draft saved!");
      if (!isEditing) resetForm();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const resetForm = () => {
    setQuestionId("");
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
  };

  const generateAutoId = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setQuestionId(random);
  };

  const handleImageChange = (setter, current) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToBase64(file, (img) => setter({ ...current, data: img, fileName: file.name }));
  };

  // Auto-suggest logic
  const handleTextareaChange = (
    setter,
    fieldName,
    ref
  ) => (e) => {
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
  };

  const handleKeyDown = (e, setter, ref) => {
    if ((e.key === "Tab" || e.key === "Enter") && suggestion && activeField) {
      e.preventDefault();
      const textarea = ref.current;
      if (!textarea) return;

      const pos = textarea.selectionStart;
      const textBefore = textarea.value.slice(0, pos);
      const openIndex = textBefore.lastIndexOf('[');

      if (openIndex !== -1) {
        const newValue =
          textarea.value.slice(0, openIndex) +
          suggestion +
          textarea.value.slice(pos);

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
  };

  if (!isAuthorized) return null;
  if (loading) return <div className="p-10 text-center text-xl">Loading question...</div>;
  if (loadError) return <div className="p-10 text-center text-xl text-red-600">{loadError}</div>;

  return (
    <div>
      <div className="p-6">
        <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">

          {/* LEFT PANEL */}
          <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-5 h-fit sticky top-24">
            <div>
              <h2 className="font-bold text-xl font-heading">
                {isEditing ? `Editing: ${questionId}` : "Create Question"}
              </h2>
              {lastSaved && (
                <p className="text-xs opacity-60 mt-1 font-mono">
                  LAST_SAVE: {new Date(lastSaved).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium block mb-1">Question ID</label>
                <input
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value.toUpperCase())}
                  placeholder="e.g. CV-HTN-001"
                  className={`border p-2 rounded w-full ${errors.questionId ? "border-red-500" : ""}`}
                  disabled={isEditing}
                />
                {errors.questionId && <p className="text-red-600 text-xs mt-1">{errors.questionId}</p>}
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={generateAutoId}
                  className="mt-6 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Auto ID
                </button>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">System</label>
              <select value={system} onChange={(e) => setSystem(e.target.value)} className={`bg-background border border-border p-2 w-full rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.system ? "border-red-500" : ""}`}>
                <option value="">Select System</option>
                {systems.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.system && <p className="text-red-600 text-xs mt-1">{errors.system}</p>}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={`bg-background border border-border p-2 w-full rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.subject ? "border-red-500" : ""}`}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subject && <p className="text-red-600 text-xs mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Topic (optional)</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" className="bg-background border border-border p-2 rounded-xl w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Correct answer</label>
              <select value={correctIndex} onChange={(e) => setCorrectIndex(parseInt(e.target.value))} className="bg-background border border-border p-2 rounded-xl w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
                <option value="4">E</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium block mb-1">Stem image displays</label>
              <select value={stemImageMode} onChange={(e) => setStemImageMode(e.target.value)} className="bg-background border border-border p-2 rounded-xl w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                <option value="auto">Show automatically</option>
                <option value="click">Click word to reveal</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium block mb-1">Explanation images display</label>
              <select value={explanationImageMode} onChange={(e) => setExplanationImageMode(e.target.value)} className="bg-background border border-border p-2 rounded-xl w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                <option value="auto">Show automatically</option>
                <option value="click">Click word to reveal</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <button 
                type="button" 
                onClick={() => saveQuestion(true)} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isEditing ? "Update & Publish" : "Publish Question"}
              </button>
              
              <button 
                type="button" 
                onClick={() => saveQuestion(false)} 
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 p-3 rounded-xl font-semibold border border-white/10 transition-all active:scale-95"
              >
                {isEditing ? "Save Draft Changes" : "Save as Draft"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm("Clear entire form? This cannot be undone.")) {
                  resetForm();
                }
              }}
              className="w-full mt-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 p-2.5 rounded-xl text-sm font-medium border border-red-500/20 transition-all font-mono"
            >
              CLEAR_FORM
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="space-y-4">

            {/* STEM */}
            <section className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 font-mono block">Question Stem</span>
              <textarea
                ref={(el) => {
                  stemRef.current = el;
                  stemTextareaRef.current = el;
                }}
                value={stem}
                onChange={handleTextareaChange(setStem, "stem")}
                onKeyDown={(e) => handleKeyDown(e, setStem, stemTextareaRef)}
                placeholder="Type [ to trigger auto-suggest for click-to-reveal"
                className={`bg-background text-foreground border border-border p-4 rounded-xl w-full resize-none min-h-[220px] text-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors.stem ? "border-red-500" : ""}`}
              />
              <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
                {stem.length} CHARS • {countWords(stem)} WORDS
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Stem image (optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-accent/20 hover:bg-accent/40 border border-border px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange(setStemImage, stemImage)}
                      />
                    </label>
                    {stemImage.fileName && (
                      <span className="text-[10px] font-mono text-primary truncate max-w-[200px] uppercase">
                        FILE: {stemImage.fileName}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Image size</label>
                  <select value={stemImage.size} onChange={(e) => setStemImage({ ...stemImage, size: e.target.value })} className="bg-background border border-border p-2 rounded-xl w-full mt-1 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm">
                    <option value="default">Default</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              {stemImage.data && (
                <div className="relative inline-block mt-4 p-2 bg-background rounded-2xl border border-border shadow-2xl">
                  <img src={stemImage.data} alt="stem" className={`${imageSizeClass(stemImage.size)} rounded-xl`} />
                  <button
                    type="button"
                    onClick={() => setStemImage({ data: "", size: "default", fileName: "" })}
                    className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all font-bold border-2 border-card"
                  >
                    ×
                  </button>
                </div>
              )}
            </section>

            {/* CHOICES */}
            <section className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 font-mono block">Choices</span>
              <div className="space-y-4">
                {choices.map((c, i) => (
                  <div key={i} className="border border-border rounded-2xl p-4 bg-background/40">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-xl font-mono">
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="flex-1 space-y-3">
                        <input
                          value={c.text}
                          onChange={(e) => {
                            const newChoices = [...choices];
                            newChoices[i].text = e.target.value;
                            setChoices(newChoices);
                          }}
                          placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                          className={`bg-background text-foreground border border-border p-3 rounded-xl w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all ${errors[`choice${i}`] ? "border-red-500" : ""}`}
                        />
                        {errors[`choice${i}`] && <p className="text-red-600 text-xs">{errors[`choice${i}`]}</p>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-accent/20 hover:bg-accent/40 border border-border px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                              Choose Image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange((val) => {
                                  const newChoices = [...choices];
                                  newChoices[i].image = { ...newChoices[i].image, ...val };
                                  setChoices(newChoices);
                                }, c.image)}
                              />
                            </label>
                            {c.image.fileName && (
                              <span className="text-[10px] font-mono text-primary truncate max-w-[180px] uppercase">
                                FILE: {c.image.fileName}
                              </span>
                            )}
                          </div>
                          <select
                            value={c.image.size}
                            onChange={(e) => {
                              const newChoices = [...choices];
                              newChoices[i].image.size = e.target.value;
                              setChoices(newChoices);
                            }}
                            className="bg-background border border-border p-2 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                          >
                            <option value="default">Default</option>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>

                        {c.image.data && (
                          <div className="relative inline-block mt-4 p-2 bg-background rounded-2xl border border-border shadow-2xl">
                            <img src={c.image.data} alt={`choice-${i}`} className={`${imageSizeClass(c.image.size)} rounded-xl`} />
                            <button
                              type="button"
                              onClick={() => {
                                const newChoices = [...choices];
                                newChoices[i].image = { data: "", size: "default", fileName: "" };
                                setChoices(newChoices);
                              }}
                              className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all font-bold border-2 border-card"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* EXPLANATIONS */}
            <section className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 font-mono mb-4 block">Explanations</span>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 font-mono block">Correct Explanation</label>
                <textarea
                  ref={(el) => {
                    expCorrectRef.current = el;
                    expCorrectTextareaRef.current = el;
                  }}
                  value={explanationCorrect}
                  onChange={handleTextareaChange(setExplanationCorrect, "correct")}
                  onKeyDown={(e) => handleKeyDown(e, setExplanationCorrect, expCorrectTextareaRef)}
                  placeholder="Why the correct answer is right..."
                  className="bg-background text-foreground border border-border p-4 rounded-xl w-full resize-none min-h-[160px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
                  {explanationCorrect.length} CHARS • {countWords(explanationCorrect)} WORDS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-accent/20 hover:bg-accent/40 border border-border px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange(setExplanationCorrectImage, explanationCorrectImage)}
                      />
                    </label>
                    {explanationCorrectImage.fileName && (
                      <span className="text-[10px] font-mono text-primary truncate max-w-[200px] uppercase">
                        FILE: {explanationCorrectImage.fileName}
                      </span>
                    )}
                  </div>
                  <select
                    value={explanationCorrectImage.size}
                    onChange={(e) => setExplanationCorrectImage({ ...explanationCorrectImage, size: e.target.value })}
                    className="bg-background border border-border p-2 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                {explanationCorrectImage.data && (
                  <div className="relative inline-block mt-4 p-2 bg-background rounded-2xl border border-border shadow-2xl">
                    <img src={explanationCorrectImage.data} alt="exp-correct" className={`${imageSizeClass(explanationCorrectImage.size)} rounded-xl`} />
                    <button
                      type="button"
                      onClick={() => setExplanationCorrectImage({ data: "", size: "default", fileName: "" })}
                      className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all font-bold border-2 border-card"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 font-mono block">Wrong Explanation</label>
                <textarea
                  ref={(el) => {
                    expWrongRef.current = el;
                    expWrongTextareaRef.current = el;
                  }}
                  value={explanationWrong}
                  onChange={handleTextareaChange(setExplanationWrong, "wrong")}
                  onKeyDown={(e) => handleKeyDown(e, setExplanationWrong, expWrongTextareaRef)}
                  placeholder="Why other choices are incorrect..."
                  className="bg-background text-foreground border border-border p-4 rounded-xl w-full resize-none min-h-[160px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
                  {explanationWrong.length} CHARS • {countWords(explanationWrong)} WORDS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-accent/20 hover:bg-accent/40 border border-border px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange(setExplanationWrongImage, explanationWrongImage)}
                      />
                    </label>
                    {explanationWrongImage.fileName && (
                      <span className="text-[10px] font-mono text-primary truncate max-w-[200px] uppercase">
                        FILE: {explanationWrongImage.fileName}
                      </span>
                    )}
                  </div>
                  <select
                    value={explanationWrongImage.size}
                    onChange={(e) => setExplanationWrongImage({ ...explanationWrongImage, size: e.target.value })}
                    className="bg-background border border-border p-2 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                {explanationWrongImage.data && (
                  <div className="relative inline-block mt-4 p-2 bg-background rounded-2xl border border-border shadow-2xl">
                    <img src={explanationWrongImage.data} alt="exp-wrong" className={`${imageSizeClass(explanationWrongImage.size)} rounded-xl`} />
                    <button
                      type="button"
                      onClick={() => setExplanationWrongImage({ data: "", size: "default", fileName: "" })}
                      className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all font-bold border-2 border-card"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 font-mono block">Summary / Key points</label>
                <textarea
                  ref={(el) => {
                    summaryRef.current = el;
                    summaryTextareaRef.current = el;
                  }}
                  value={summary}
                  onChange={handleTextareaChange(setSummary, "summary")}
                  onKeyDown={(e) => handleKeyDown(e, setSummary, summaryTextareaRef)}
                  placeholder="Key takeaways from this case..."
                  className="bg-background text-foreground border border-border p-4 rounded-xl w-full resize-none min-h-[160px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
                  {summary.length} CHARS • {countWords(summary)} WORDS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-accent/20 hover:bg-accent/40 border border-border px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange(setSummaryImage, summaryImage)}
                      />
                    </label>
                    {summaryImage.fileName && (
                      <span className="text-[10px] font-mono text-primary truncate max-w-[200px] uppercase">
                        FILE: {summaryImage.fileName}
                      </span>
                    )}
                  </div>
                  <select
                    value={summaryImage.size}
                    onChange={(e) => setSummaryImage({ ...summaryImage, size: e.target.value })}
                    className="bg-background border border-border p-2 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                {summaryImage.data && (
                  <div className="relative inline-block mt-4 p-2 bg-background rounded-2xl border border-border shadow-2xl">
                    <img src={summaryImage.data} alt="summary" className={`${imageSizeClass(summaryImage.size)} rounded-xl`} />
                    <button
                      type="button"
                      onClick={() => setSummaryImage({ data: "", size: "default", fileName: "" })}
                      className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all font-bold border-2 border-card"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Collapsible Live Preview */}
            <details open className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm transition-all">
              <summary className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 font-mono cursor-pointer select-none hover:text-primary transition-colors">
                Live Preview
              </summary>
              <div className="mt-8">
                <div className="max-w-3xl mx-auto bg-background/50 p-8 rounded-2xl border border-border shadow-inner">
                  <div className="mb-6">
                    <div className="text-sm opacity-50 mb-1 font-mono uppercase tracking-widest">
                      {system || "SYSTEM"} • {subject || "SUBJECT"} {topic && `• ${topic}`}
                    </div>
                    <div className="text-lg font-semibold mb-4 whitespace-pre-wrap">
                      {stem || "Question stem will appear here..."}
                    </div>

                    {stemImage.data && (
                      <img
                        src={stemImage.data}
                        alt="stem preview"
                        className={`${imageSizeClass(stemImage.size)} mx-auto mb-6 shadow-2xl rounded-2xl border border-border`}
                      />
                    )}
                  </div>

                  <div className="space-y-4 mb-10">
                    {choices.map((c, i) => (
                      <div
                        key={i}
                        className={`p-6 rounded-2xl border-2 transition-all duration-300 ${i === correctIndex
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                          : "border-border bg-background hover:border-primary/30"
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`font-mono font-black text-2xl w-10 text-center ${i === correctIndex ? "text-primary" : "opacity-40"}`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <div className="flex-1">
                            <p className="text-lg leading-relaxed">
                              {c.text || `(Choice ${String.fromCharCode(65 + i)})`}
                            </p>
                            {c.image.data && (
                              <div className="mt-4 p-2 bg-background rounded-xl border border-border shadow-lg inline-block">
                                <img
                                  src={c.image.data}
                                  alt={`choice ${String.fromCharCode(65 + i)}`}
                                  className={`${imageSizeClass(c.image.size || "default")} rounded-lg`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t">
                    <div className="text-green-700 font-semibold mb-2">Correct answer explanation:</div>
                    <div className="mb-4 whitespace-pre-wrap">{explanationCorrect || "Explanation for the correct choice..."}</div>
                    {explanationCorrectImage.data && (
                      <img
                        src={explanationCorrectImage.data}
                        alt="correct exp"
                        className={`${imageSizeClass(explanationCorrectImage.size)} mb-6 rounded-lg`}
                      />
                    )}

                    <div className="text-red-700 font-semibold mb-2">Why other answers are wrong:</div>
                    <div className="mb-4 whitespace-pre-wrap">{explanationWrong || "Explanation for incorrect choices..."}</div>
                    {explanationWrongImage.data && (
                      <img
                        src={explanationWrongImage.data}
                        alt="wrong exp"
                        className={`${imageSizeClass(explanationWrongImage.size)} mb-6 rounded-lg`}
                      />
                    )}

                    {(summary || summaryImage.data) && (
                      <>
                        <div className="text-indigo-700 font-semibold mb-2">Summary / Key points</div>
                        <div className="whitespace-pre-wrap">{summary || "Key summary points..."}</div>
                        {summaryImage.data && (
                          <img
                            src={summaryImage.data}
                            alt="summary"
                            className={`${imageSizeClass(summaryImage.size)} mt-4 rounded-lg`}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </form>

        {/* Auto-suggest tooltip */}
        {suggestion && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium z-50 flex items-center gap-3">
            Press <kbd className="bg-blue-800 px-2 py-1 rounded text-xs">Tab</kbd> or <kbd className="bg-blue-800 px-2 py-1 rounded text-xs">Enter</kbd> to complete:
            <span className="font-bold bg-blue-700 px-2 py-1 rounded">{suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
}
