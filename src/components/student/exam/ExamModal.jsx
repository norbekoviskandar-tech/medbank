"use client";

import React from "react";
import { AlertTriangle, Check, LogOut } from "lucide-react";
import { useExam } from "@/context/ExamContext";

export default function ExamModal() {
  const { modal, setModal } = useExam();

  if (!modal.show) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#001b3d]/60 backdrop-blur-[2px] animate-in fade-in duration-300" 
        onClick={() => setModal({ ...modal, show: false })} 
      />
      <div className="bg-white dark:bg-[#16161a] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative max-w-[400px] w-full overflow-hidden animate-in zoom-in-95 fade-in duration-300 border-none">
        {/* Header section based on type */}
        {modal.type === 'danger' && (
          <div className="bg-[#fffbeb] p-8 flex flex-col items-center border-b border-amber-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-[0_4px_10px_rgba(217,119,6,0.15)]">
              <AlertTriangle size={32} className="text-amber-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-[#92400e] text-center">
              {modal.title}
            </h3>
          </div>
        )}
        {modal.type === 'confirm' && (
          <div className="bg-emerald-50 p-8 flex flex-col items-center border-b border-emerald-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-[0_4px_10px_rgba(16,185,129,0.15)]">
              <Check size={32} className="text-emerald-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-emerald-800 text-center">
              {modal.title}
            </h3>
          </div>
        )}
        {modal.type === 'info' && (
          <div className="bg-blue-50 p-8 flex flex-col items-center border-b border-blue-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-[0_4px_10px_rgba(59,130,246,0.15)]">
              <LogOut size={32} className="text-blue-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-800 text-center">
              {modal.title}
            </h3>
          </div>
        )}

        <div className="p-10 pt-8 bg-[#1e1e24] dark:bg-[#16161a]">
          <p className="text-[15px] font-medium leading-relaxed text-zinc-400 text-center mb-10">
            {modal.message}
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                modal.onConfirm();
                setModal({ ...modal, show: false });
              }}
              className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${modal.type === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'
                : modal.type === 'confirm'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30'
                : 'bg-[#1d46af] text-white hover:bg-[#16368a] shadow-blue-500/30'
                }`}
            >
              {modal.confirmText || 'Confirm & Continue'}
            </button>
            <button
              onClick={() => setModal({ ...modal, show: false })}
              className="w-full py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
