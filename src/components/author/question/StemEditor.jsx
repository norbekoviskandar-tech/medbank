"use client";

import React, { useRef } from "react";
import { countWords, imageSizeClass, useAutoResizeTextarea } from "@/hooks/author/useQuestionEditor";

export default function StemEditor({ editor }) {
  const {
    stem, setStem, errors, handleTextareaChange,
    handleKeyDownSuggested, stemImage, setStemImage, handleImageChange
  } = editor;

  const stemTextareaRef = useRef(null);
  const stemRef = useAutoResizeTextarea(stem);

  return (
    <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_15px_40px_rgba(0,0,94,0.04)] space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0066CC] font-mono block ml-1">Question Content</span>
      <textarea
        ref={(el) => {
          stemRef.current = el;
          stemTextareaRef.current = el;
        }}
        value={stem}
        onChange={handleTextareaChange(setStem, "stem")}
        onKeyDown={(e) => handleKeyDownSuggested(e, setStem, stemTextareaRef)}
        placeholder="Type question stem here... Use [ to trigger auto-suggest"
        className={`bg-[#FDFDFD] text-[#1B263B] border border-slate-200 p-3 rounded-lg w-full resize-none min-h-[100px] text-sm font-medium focus:ring-8 focus:ring-[#0066CC]/5 focus:border-[#0066CC] outline-none transition-all ${errors.stem ? "border-red-500" : ""}`}
      />
      <div className="flex justify-between items-center px-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {stem.length} Characters • {countWords(stem)} Words
        </p>
        {errors.stem && <p className="text-red-600 text-[10px] font-bold uppercase">{errors.stem}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 ml-1">Stem Image</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-[#0066CC] hover:bg-[#0055AA] text-white border-2 border-[#0066CC] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0066CC]/30 hover:shadow-xl hover:shadow-[#0066CC]/40">
              Select Asset
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange(setStemImage, stemImage)}
              />
            </label>
            {stemImage.fileName && (
              <span className="text-[10px] font-black text-primary truncate max-w-[200px] uppercase tracking-widest">
                {stemImage.fileName}
              </span>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Image size</label>
          <select value={stemImage.size} onChange={(e) => setStemImage({ ...stemImage, size: e.target.value })} className="bg-background text-foreground border border-border p-2 rounded-xl w-full mt-1 focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-panel/30 text-sm">
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
  );
}
