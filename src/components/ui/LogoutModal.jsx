"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertCircle } from "lucide-react";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl p-8 overflow-hidden border border-border"
          >
             {/* Decorative background blur */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-50/50 to-transparent pointer-events-none" />

             <div className="flex flex-col items-center text-center gap-6 relative z-10">
               <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-2 border-4 border-red-50">
                 <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-inner">
                    <LogOut size={32} strokeWidth={2.5} className="ml-1" />
                 </div>
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Signing Out?</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                    You are about to end your secure session. Please confirm to proceed.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-3 w-full mt-2">
                 <button
                   onClick={onClose}
                   className="py-3.5 px-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={onConfirm}
                   className="py-3.5 px-4 rounded-2xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600 shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)] transition-all active:scale-95"
                 >
                   Confirm
                 </button>
               </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
