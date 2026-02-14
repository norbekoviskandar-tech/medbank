"use client";

import React from "react";
import { imageSizeClass } from "@/hooks/author/useQuestionEditor";

export default function OptionEditor({ editor }) {
  const {
    choices, setChoices, errors, handleImageChange
  } = editor;

  return (
    <section className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-mono block ml-1">Distractors & Options</span>
      <div className="space-y-2">
        {choices.map((c, i) => (
          <div key={i} className="border border-border rounded-lg p-2 bg-panel/20 transition-all hover:bg-panel/30 group">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-primary text-white font-black rounded shadow-md text-sm font-mono">
                {String.fromCharCode(65 + i)}
              </div>
              <div className="flex-1 space-y-1">
                <input
                  value={c.text}
                  onChange={(e) => {
                    const newChoices = [...choices];
                    newChoices[i].text = e.target.value;
                    setChoices(newChoices);
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className={`bg-background text-foreground border border-border px-3 py-1.5 rounded-lg w-full focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium ${errors[`choice${i}`] ? "border-red-500" : "focus:border-primary/20"}`}
                />
                {errors[`choice${i}`] && <p className="text-red-600 text-[9px] font-bold uppercase ml-1">{errors[`choice${i}`]}</p>}

                <div className="flex items-center gap-2 mt-1">
                  <label className="cursor-pointer bg-[#0066CC] hover:bg-[#0055AA] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                    Add Asset
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
                  <select
                    value={c.image.size}
                    onChange={(e) => {
                      const newChoices = [...choices];
                      newChoices[i].image.size = e.target.value;
                      setChoices(newChoices);
                    }}
                    className="bg-background text-foreground border border-border px-2 py-1 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all text-[10px]"
                  >
                    <option value="default">Size</option>
                    <option value="small">S</option>
                    <option value="medium">M</option>
                    <option value="large">L</option>
                  </select>
                  {c.image.fileName && (
                    <span className="text-[9px] font-bold text-primary truncate max-w-[120px] uppercase">
                      {c.image.fileName}
                    </span>
                  )}
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
  );
}
