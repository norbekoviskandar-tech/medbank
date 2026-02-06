"use client";

import React, { useRef } from "react";
import { countWords, imageSizeClass, useAutoResizeTextarea } from "@/hooks/author/useQuestionEditor";

export default function ExplanationEditor({ editor }) {
  const {
    explanationCorrect, setExplanationCorrect, explanationCorrectImage, setExplanationCorrectImage,
    explanationWrong, setExplanationWrong, explanationWrongImage, setExplanationWrongImage,
    summary, setSummary, summaryImage, setSummaryImage,
    handleTextareaChange, handleKeyDownSuggested, handleImageChange
  } = editor;

  const expCorrectTextareaRef = useRef(null);
  const expWrongTextareaRef = useRef(null);
  const summaryTextareaRef = useRef(null);

  const expCorrectRef = useAutoResizeTextarea(explanationCorrect);
  const expWrongRef = useAutoResizeTextarea(explanationWrong);
  const summaryRef = useAutoResizeTextarea(summary);

  return (
    <section className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-mono block ml-1">Rationale & Analysis</span>

      {/* Correct Rationale */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 font-mono block ml-1">Correct Rationale</label>
        <textarea
          ref={(el) => {
            expCorrectRef.current = el;
            expCorrectTextareaRef.current = el;
          }}
          value={explanationCorrect}
          onChange={handleTextareaChange(setExplanationCorrect, "correct")}
          onKeyDown={(e) => handleKeyDownSuggested(e, setExplanationCorrect, expCorrectTextareaRef)}
          placeholder="Explain why the correct answer is right..."
          className="bg-background text-foreground border border-border p-5 rounded-2xl w-full resize-none min-h-[160px] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium focus:border-primary/20"
        />
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {explanationCorrect.length} Characters • {countWords(explanationCorrect)} Words
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-[#0066CC] hover:bg-[#0055AA] text-white border-2 border-[#0066CC] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-[#0066CC]/25 hover:shadow-lg hover:shadow-[#0066CC]/35">
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
                {explanationCorrectImage.fileName}
              </span>
            )}
          </div>
          <select
            value={explanationCorrectImage.size}
            onChange={(e) => setExplanationCorrectImage({ ...explanationCorrectImage, size: e.target.value })}
            className="bg-background text-foreground border border-border p-2 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-panel/30 text-sm"
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

      {/* Distractor Analysis */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 font-mono block ml-1">Distractor Analysis</label>
        <textarea
          ref={(el) => {
            expWrongRef.current = el;
            expWrongTextareaRef.current = el;
          }}
          value={explanationWrong}
          onChange={handleTextareaChange(setExplanationWrong, "wrong")}
          onKeyDown={(e) => handleKeyDownSuggested(e, setExplanationWrong, expWrongTextareaRef)}
          placeholder="Explain why other choices are incorrect..."
          className="bg-background text-foreground border border-border p-4 rounded-xl w-full resize-none min-h-[80px] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium focus:border-primary/20 text-sm"
        />
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {explanationWrong.length} Characters • {countWords(explanationWrong)} Words
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0066CC] font-mono block ml-1">Key Summary</label>
        <textarea
          ref={(el) => {
            summaryRef.current = el;
            summaryTextareaRef.current = el;
          }}
          value={summary}
          onChange={handleTextareaChange(setSummary, "summary")}
          onKeyDown={(e) => handleKeyDownSuggested(e, setSummary, summaryTextareaRef)}
          placeholder="Brief educational objective..."
          className="bg-background text-foreground border border-border p-4 rounded-xl w-full resize-none min-h-[60px] focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium focus:border-primary/20 text-sm italic"
        />
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {summary.length} Characters • {countWords(summary)} Words
          </p>
        </div>
      </div>
    </section>
  );
}
