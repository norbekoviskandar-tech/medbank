"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDangerous = false }) {
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
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-white/20"
          >
             {/* Decorative background */}
             <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${isDangerous ? 'from-red-50/50' : 'from-blue-50/50'} to-transparent pointer-events-none`} />

             <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-20"
             >
                <X size={18} />
             </button>

             <div className="flex flex-col items-center text-center gap-6 relative z-10 pt-2">
               <div className={`w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-2 border-4 ${isDangerous ? 'border-red-50' : 'border-blue-50'}`}>
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-inner ${isDangerous ? 'bg-red-500' : 'bg-blue-500'}`}>
                    <AlertTriangle size={32} strokeWidth={2.5} />
                 </div>
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                    {message}
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
                   className={`py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${isDangerous ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
                 >
                   {confirmText}
                 </button>
               </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
