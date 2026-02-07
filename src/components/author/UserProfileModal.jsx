"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Clock, BookOpen, Mail, User, ShieldCheck, AlertCircle, Save } from 'lucide-react';
import { updateUserSubscription, getArchiveMetadata } from '@/services/user.service';

export default function UserProfileModal({ user, onClose, onUpdate }) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(user.subscriptionStatus || 'expired');

  const handleUpdateSubscription = async () => {
    setIsSaving(true);
    try {
      const isPaid = status === 'active-paid';
      const actualStatus = status.startsWith('active') ? 'active' : status;
      const days = status === 'active-trial' ? 3 : 90;
      
      await updateUserSubscription(user.id, actualStatus, days, isPaid);
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update subscription");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[32px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary/40 p-[1px] shadow-lg shadow-primary/20">
              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center text-primary text-2xl font-black">
                {user.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-heading font-black text-foreground tracking-tight">{user.name || 'Anonymous Student'}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{user.email}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {user.subscriptionStatus === 'active' 
                    ? (user.activatedByPurchase || user.purchased ? 'Paid Access' : 'Free Trial')
                    : 'No Active Access'}
                </span>
                {user.expiresAt && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Expires: {new Date(user.expiresAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-panel hover:bg-border transition-all text-muted-foreground hover:text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">Subscription Control</label>
              <div className="space-y-3">
                <button 
                  onClick={() => setStatus('active-paid')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    status === 'active-paid' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                    : 'bg-panel border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Grant Paid Access</span>
                  </div>
                  {status === 'active-paid' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />}
                </button>

                <button 
                  onClick={() => setStatus('active-trial')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    status === 'active-trial' 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' 
                    : 'bg-panel border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Grant Free Trial</span>
                  </div>
                  {status === 'active-trial' && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                </button>

                <button 
                  onClick={() => setStatus('expired')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    status === 'expired' 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                    : 'bg-panel border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Expired Session</span>
                  </div>
                  {status === 'expired' && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />}
                </button>

                <button 
                  onClick={() => setStatus('canceled')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    status === 'canceled' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-600' 
                    : 'bg-panel border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Canceled Access</span>
                  </div>
                  {status === 'canceled' && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleUpdateSubscription}
                disabled={isSaving || status === user.subscriptionStatus}
                className="w-full bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-95 transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Access Changes
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-3xl p-6">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-4">Mastery Statistics</label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Overall Progress</span>
                  <span className="text-sm font-black text-foreground">{user.progress?.percentage || 0}%</span>
                </div>
                <div className="h-2 w-full bg-panel border border-border/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-1000" style={{ width: `${user.progress?.percentage || 0}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-card border border-border/50 rounded-2xl p-4">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Completed</div>
                    <div className="text-xl font-black text-foreground">{user.progress?.completed || 0}</div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl p-4">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Accuracy</div>
                    <div className={`text-xl font-black ${user.progress?.accuracy >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {user.progress?.accuracy || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-3xl p-6 flex-1 overflow-hidden flex flex-col">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-4">Performance Analysis</label>
              <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                {user.progress?.systems && Object.entries(user.progress.systems).map(([name, data]) => {
                  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-foreground/80 uppercase tracking-tight">{name}</span>
                        <span className="font-mono text-muted-foreground">{pct}% ({data.correct}/{data.total})</span>
                      </div>
                      <div className="h-1 w-full bg-panel rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Archived Data Insights */}
              {(() => {
                const archive = getArchiveMetadata(user);
                if (!archive) return null;
                return (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 mb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Archived Data Pool</span>
                    </div>
                    <p className="text-[11px] text-amber-700/70 font-medium mb-3">
                      This student&apos;s paid access ended. Tests, notes, and flashcards are safely archived for 30 days.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black text-amber-700 uppercase">
                        {archive.daysRemaining} Days Until Wiped
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button className="w-full bg-panel border border-border text-foreground hover:text-primary hover:border-primary/30 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                <Mail size={16} />
                Send Manual Alert
              </button>

              <div className="h-[1px] bg-slate-100 my-2" />

              <button
                onClick={async () => {
                  if (confirm("CRITICAL: Are you sure you want to PERMANENTLY TERMINATE this account? All tests, progress, and data will be IRREVERSIBLY PURGED.")) {
                    try {
                      setIsSaving(true);
                      const { deleteUser } = await import("@/services/user.service");
                      await deleteUser(user.id);
                      alert("Identity Purged: Account and all associated data have been erased from the master registry.");
                      onUpdate();
                      onClose();
                    } catch (err) {
                      alert("Purge Failed: " + err.message);
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }}
                disabled={isSaving}
                className="w-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-3"
              >
                <AlertCircle size={16} />
                Terminate Account permanently
              </button>

              <p className="text-[10px] text-muted-foreground text-center italic mt-2 uppercase tracking-tight font-mono opacity-50">Authorized as verified administrator</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
