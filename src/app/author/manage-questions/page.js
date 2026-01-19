"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllQuestions, deleteQuestion, updateQuestion, addQuestion, getQuestionById } from "@/services/question.service";

function imageSizeClass(size) {
  if (size === "small") return "max-w-240 mx-auto rounded border mt-3 block";
  if (size === "medium") return "max-w-480 mx-auto rounded border mt-3 block";
  if (size === "large") return "max-w-720 mx-auto rounded border mt-3 block";
  return "max-w-full mx-auto rounded border mt-3 block";
}

export default function ManageQuestionsPage() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [filterSystem, setFilterSystem] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterStem, setFilterStem] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;

  // Preview modal
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [revealedImages, setRevealedImages] = useState(new Set());

  // Reset revealed images whenever a new preview is opened
  useEffect(() => {
    setRevealedImages(new Set());
  }, [previewQuestion]);

  const fileInputRef = useRef(null);

  const systems = [
    "Cardiovascular", "Respiratory", "Renal", "Gastrointestinal", "Neurology",
    "Musculoskeletal", "Endocrine", "Reproductive", "Hematology", "Dermatology",
    "Psychiatry", "Multisystem"
  ];

  const subjects = [
    "Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology",
    "Microbiology", "Immunology", "Behavioral Science", "Genetics",
    "Biostatistics", "Epidemiology"
  ];

  // Auth check
  useEffect(() => {
    const unlocked = localStorage.getItem("medbank-author-unlocked");
    if (unlocked === "true") setOk(true);
    else router.push("/author");
  }, [router]);

  // Load questions
  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await getAllQuestions();
      setQuestions(all || []);
    } catch (err) {
      console.error("Load error:", err);
      setError("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // Toggle published
  const togglePublished = async (question) => {
    if (!confirm(`Change status to ${question.published ? "Draft" : "Published"}?`)) return;

    const updated = { ...question, published: !question.published };
    try {
      await updateQuestion(updated);
      setQuestions(prev => prev.map(q => q.id === question.id ? updated : q));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // Delete with confirmation
  const handleDelete = async (id) => {
    if (!confirm("Delete this question permanently? This cannot be undone.")) return;
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete question");
    }
  };

  // Bulk publish
  const bulkPublish = async () => {
    const toPublish = paginated.filter(q => !q.published);
    if (!toPublish.length) return alert("No drafts selected on this page");
    if (!confirm(`Publish ${toPublish.length} draft(s)?`)) return;

    try {
      await Promise.all(toPublish.map(q => updateQuestion({ ...q, published: true })));
      await loadQuestions();
      alert(`Published ${toPublish.length} questions`);
    } catch (err) {
      alert("Bulk publish failed");
      console.error(err);
    }
  };

  // Bulk unpublish
  const bulkUnpublish = async () => {
    const toUnpublish = paginated.filter(q => q.published);
    if (!toUnpublish.length) return alert("No published questions on this page");
    if (!confirm(`Unpublish ${toUnpublish.length} question(s)?`)) return;

    try {
      await Promise.all(toUnpublish.map(q => updateQuestion({ ...q, published: false })));
      await loadQuestions();
      alert(`Unpublished ${toUnpublish.length} questions`);
    } catch (err) {
      alert("Bulk unpublish failed");
      console.error(err);
    }
  };

  // Export to JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medbank-questions-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import from JSON
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid format");

        let added = 0;
        let updated = 0;

        for (const q of imported) {
          if (!q.id) continue;
          const exists = await getQuestionById(q.id);
          if (exists) {
            await updateQuestion(q);
            updated++;
          } else {
            await addQuestion(q);
            added++;
          }
        }

        alert(`Import complete!\nAdded: ${added}\nUpdated: ${updated}`);
        loadQuestions();
      } catch (err) {
        console.error(err);
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Sorting & Filtering
  const sortedQuestions = [...questions].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  const filteredQuestions = sortedQuestions.filter(q => {
    return (
      (!filterSystem || q.system === filterSystem) &&
      (!filterSubject || q.subject === filterSubject) &&
      (!filterTopic || q.topic?.toLowerCase().includes(filterTopic.toLowerCase())) &&
      (!filterStem || q.stem?.toLowerCase().includes(filterStem.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const paginated = filteredQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  if (!ok) return null;

  return (
    <div className="font-body">
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Q Bank <span className="cyber-gradient-text">Management</span></h1>
            <p className="text-gray-400 mt-2">Manage your question database, import/export data, and monitor status</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Export JSON
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm cursor-pointer">
              Import JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
                ref={fileInputRef}
              />
            </label>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Total: {questions.length} • Filtered: {filteredQuestions.length}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filterSystem} onChange={e => { setFilterSystem(e.target.value); setCurrentPage(1); }} className="bg-card text-foreground border border-border p-2 rounded-xl min-w-[160px] focus:ring-2 focus:ring-primary/20 outline-none transition-all">
            <option value="">All Systems</option>
            {systems.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setCurrentPage(1); }} className="bg-card text-foreground border border-border p-2 rounded-xl min-w-[160px] focus:ring-2 focus:ring-primary/20 outline-none transition-all">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input placeholder="Filter Topic" value={filterTopic} onChange={e => { setFilterTopic(e.target.value); setCurrentPage(1); }} className="bg-card text-foreground border border-border p-2 rounded-xl min-w-[160px] focus:ring-2 focus:ring-primary/20 outline-none transition-all" />

          <input placeholder="Filter Stem" value={filterStem} onChange={e => { setFilterStem(e.target.value); setCurrentPage(1); }} className="bg-card text-foreground border border-border p-2 rounded-xl min-w-[160px] focus:ring-2 focus:ring-primary/20 outline-none transition-all" />

          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }} className="bg-card text-foreground border border-border p-2 rounded-xl min-w-[140px] focus:ring-2 focus:ring-primary/20 outline-none transition-all">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button onClick={() => {
            setFilterSystem("");
            setFilterSubject("");
            setFilterTopic("");
            setFilterStem("");
            setCurrentPage(1);
          }} className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-xl text-sm transition-all border border-border">
            Clear Filters
          </button>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={bulkPublish}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
              disabled={paginated.every(q => q.published)}
            >
              Bulk Publish
            </button>
            <button
              onClick={bulkUnpublish}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm disabled:opacity-50"
              disabled={paginated.every(q => !q.published)}
            >
              Bulk Unpublish
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 opacity-50 bg-card rounded-2xl border border-border">No questions found</div>
        ) : (
          <>
            <div className="overflow-x-auto bg-card rounded-2xl border border-border shadow-sm mb-6">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-accent/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">System</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">Stem</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-foreground/60 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map(q => (
                    <tr key={q.id} className="hover:bg-accent/10 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono opacity-80">{q.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap opacity-80">{q.system || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap opacity-80">{q.subject || '-'}</td>
                      <td className="px-4 py-4 opacity-80">{q.topic || '-'}</td>
                      <td className="px-4 py-4 max-w-xs">
                        <div className="line-clamp-2 text-sm opacity-80" title={q.stem}>
                          {q.stem?.substring(0, 80) || "No stem"}{q.stem?.length > 80 ? '...' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm opacity-60">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${q.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {q.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm flex gap-3">
                        <button onClick={() => router.push(`/author/create-question?id=${q.id}`)} className="text-blue-600 hover:text-blue-800">
                          Edit
                        </button>
                        <button onClick={() => togglePublished(q)} className={q.published ? "text-amber-600 hover:text-amber-800" : "text-green-600 hover:text-green-800"}>
                          {q.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-800">
                          Delete
                        </button>
                        <button onClick={() => setPreviewQuestion(q)} className="text-indigo-600 hover:text-indigo-800">
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8 font-mono text-sm">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-6 py-2 border border-border bg-card hover:bg-accent transition-all rounded-xl disabled:opacity-30">
                  PREV
                </button>
                <span className="opacity-60">PAGE {currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-6 py-2 border border-border bg-card hover:bg-accent transition-all rounded-xl disabled:opacity-30">
                  NEXT
                </button>
              </div>
            )}
          </>
        )
        }

        {/* Preview Modal */}
        {previewQuestion && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewQuestion(null)}>
            <div className="bg-card text-card-foreground rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-border relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setPreviewQuestion(null)} className="absolute top-6 right-6 text-3xl opacity-50 hover:opacity-100 transition-opacity">
                ×
              </button>

              <h2 className="text-2xl font-bold font-heading mb-6 cyber-gradient-text">QUESTION_PREVIEW: {previewQuestion.id}</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                <div><strong>System:</strong> {previewQuestion.system || '-'}</div>
                <div><strong>Subject:</strong> {previewQuestion.subject || '-'}</div>
                <div><strong>Topic:</strong> {previewQuestion.topic || '-'}</div>
                <div><strong>Status:</strong> {previewQuestion.published ? 'Published' : 'Draft'}</div>
              </div>

              {/* Stem */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-2">Stem</h3>
                <p className="mb-4 whitespace-pre-wrap">{previewQuestion.stem || "No stem"}</p>
                {previewQuestion.stemImage?.data && (
                  revealedImages.has('stem') ? (
                    <img src={previewQuestion.stemImage.data} alt="Stem" className={`rounded-lg shadow ${imageSizeClass(previewQuestion.stemImage.size || "default")}`} />
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setRevealedImages(prev => { const s = new Set(prev); s.add('stem'); return s; })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setRevealedImages(prev => { const s = new Set(prev); s.add('stem'); return s; }); } }}
                      className={`rounded-xl border border-border bg-accent/20 cursor-pointer flex items-center justify-center overflow-hidden`}
                      style={{ backgroundImage: `url(${previewQuestion.stemImage.data})`, minHeight: 160, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                      <span className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase">Click to reveal</span>
                    </div>
                  )
                )}
              </div>

              {/* Choices */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-3">Choices</h3>
                <div className="space-y-4">
                  {previewQuestion.choices?.map((c, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="font-bold w-8">{String.fromCharCode(65 + i)}.</span>
                      <div>
                        <p className="mb-2">{c.text || "No text"}</p>
                        {c.image?.data && (
                          revealedImages.has(`choice-${i}`) ? (
                            <img src={c.image.data} alt={`Choice ${String.fromCharCode(65 + i)}`} className={`rounded-lg shadow ${imageSizeClass(c.image.size || "default")}`} />
                          ) : (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setRevealedImages(prev => { const s = new Set(prev); s.add(`choice-${i}`); return s; })}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setRevealedImages(prev => { const s = new Set(prev); s.add(`choice-${i}`); return s; }); } }}
                              className={`rounded-lg shadow ${imageSizeClass(c.image.size || "default")} bg-center bg-cover bg-gray-100 cursor-pointer flex items-center justify-center`}
                              style={{ backgroundImage: `url(${c.image.data})`, minHeight: 80 }}
                            >
                              <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded">Click to reveal</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanations */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Explanations</h3>
                {previewQuestion.explanationCorrect && (
                  <div className="mb-6">
                    <p className="font-medium mb-2">Correct:</p>
                    <p className="whitespace-pre-wrap">{previewQuestion.explanationCorrect}</p>
                    {previewQuestion.explanationCorrectImage?.data && (
                      revealedImages.has('explanation-correct') ? (
                        <img src={previewQuestion.explanationCorrectImage.data} alt="Correct" className={`mt-3 rounded-lg shadow ${imageSizeClass(previewQuestion.explanationCorrectImage.size || "default")}`} />
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setRevealedImages(prev => { const s = new Set(prev); s.add('explanation-correct'); return s; })}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setRevealedImages(prev => { const s = new Set(prev); s.add('explanation-correct'); return s; }); } }}
                          className={`mt-3 rounded-lg shadow ${imageSizeClass(previewQuestion.explanationCorrectImage.size || "default")} bg-center bg-cover bg-gray-100 cursor-pointer flex items-center justify-center`}
                          style={{ backgroundImage: `url(${previewQuestion.explanationCorrectImage.data})`, minHeight: 100 }}
                        >
                          <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded">Click to reveal</span>
                        </div>
                      )
                    )}
                  </div>
                )}
                {previewQuestion.explanationWrong && (
                  <div className="mb-6">
                    <p className="font-medium mb-2">Wrong:</p>
                    <p className="whitespace-pre-wrap">{previewQuestion.explanationWrong}</p>
                    {previewQuestion.explanationWrongImage?.data && (
                      revealedImages.has('explanation-wrong') ? (
                        <img src={previewQuestion.explanationWrongImage.data} alt="Wrong" className={`mt-3 rounded-lg shadow ${imageSizeClass(previewQuestion.explanationWrongImage.size || "default")}`} />
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setRevealedImages(prev => { const s = new Set(prev); s.add('explanation-wrong'); return s; })}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setRevealedImages(prev => { const s = new Set(prev); s.add('explanation-wrong'); return s; }); } }}
                          className={`mt-3 rounded-lg shadow ${imageSizeClass(previewQuestion.explanationWrongImage.size || "default")} bg-center bg-cover bg-gray-100 cursor-pointer flex items-center justify-center`}
                          style={{ backgroundImage: `url(${previewQuestion.explanationWrongImage.data})`, minHeight: 100 }}
                        >
                          <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded">Click to reveal</span>
                        </div>
                      )
                    )}
                  </div>
                )}
                {previewQuestion.summary && (
                  <div>
                    <p className="font-medium mb-2">Summary:</p>
                    <p className="whitespace-pre-wrap">{previewQuestion.summary}</p>
                    {previewQuestion.summaryImage?.data && (
                      revealedImages.has('summary') ? (
                        <img src={previewQuestion.summaryImage.data} alt="Summary" className={`mt-3 rounded-lg shadow ${imageSizeClass(previewQuestion.summaryImage.size || "default")}`} />
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setRevealedImages(prev => { const s = new Set(prev); s.add('summary'); return s; })}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setRevealedImages(prev => { const s = new Set(prev); s.add('summary'); return s; }); } }}
                          className={`mt-3 rounded-lg shadow ${imageSizeClass(previewQuestion.summaryImage.size || "default")} bg-center bg-cover bg-gray-100 cursor-pointer flex items-center justify-center`}
                          style={{ backgroundImage: `url(${previewQuestion.summaryImage.data})`, minHeight: 100 }}
                        >
                          <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded">Click to reveal</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
