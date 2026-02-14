"use client";

import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Calendar, Clock, Settings, Key, ShieldCheck, X, LogOut, CreditCard } from "lucide-react";
import { getUserById, updateUser, getUserSubscriptions } from "@/services/user.service";
import { changeUserPassword } from "@/auth/auth.logic";
import LogoutModal from "@/components/ui/LogoutModal";
import { AppContext } from "@/context/AppContext";

export default function AccountDropdown() {
  const { selectedStudentProduct } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("medbank_user");
    if (userId) {
      loadUser(userId);
    }
  }, []);

  useEffect(() => {
    async function fetchSub() {
      const userId = localStorage.getItem("medbank_user");
      const pId = selectedStudentProduct?.id;
      if (userId && pId) {
        try {
          console.log(`[AccountDropdown] Fetching sub for product: ${pId}`);
          const subs = await getUserSubscriptions(userId);
          const currentSub = subs.find(s => 
            String(s.packageId) === String(pId) && 
            s.status === 'active'
          );
          setActiveSubscription(currentSub);
        } catch (e) {
          console.error("Failed to fetch product sub:", e);
        }
      }
    }
    fetchSub();
  }, [selectedStudentProduct]);

  const loadUser = async (id) => {
    if (!id) return setUser(null);
    const data = await getUserById(id);
    setUser(data);
  };



  if (!user) return null;

  const joinDate = new Date(user.createdAt || Date.now());
  
  // Scoped Data: Prefer activeSubscription for the selected product
  const targetSub = activeSubscription || user;
  const isPremium = activeSubscription?.status === 'active' || user.subscriptionStatus === 'active' || user.purchased;

  // Calculate Expiration & Remaining Days
  const trialDuration = user.subscriptionDuration || 3;
  const trialExpirationDate = new Date(joinDate.getTime() + trialDuration * 24 * 60 * 60 * 1000);
  
  const expiresAt = activeSubscription?.expiresAt || user.expiresAt;
  const displayExpiration = expiresAt ? new Date(expiresAt).toLocaleDateString() : trialExpirationDate.toLocaleDateString();
  
  const daysRemaining = expiresAt 
    ? Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : Math.ceil((trialExpirationDate - new Date()) / (1000 * 60 * 60 * 24));
  
  const totalDuration = activeSubscription?.durationDays || user.subscriptionDuration || 3;

  return (
    <div className="relative">
      {/* Clickable Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-[#004e92] text-white flex items-center justify-center font-bold text-sm shadow-md hover:bg-[#003366] transition-all border-2 border-white"
      >
        {user.name?.charAt(0) || "U"}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Card */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[350px] bg-white dark:bg-[#121214] rounded-3xl shadow-2xl border border-border overflow-hidden z-50 p-6 transition-colors duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004e92] to-[#00bbd4] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">{user.name || "Student"}</h3>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-zinc-300 hover:text-zinc-500">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Details Section */}
                <div className="bg-background rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} /> Email
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-2">
                       <Calendar size={14} /> Joined
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{joinDate.toLocaleDateString()}</span>
                  </div>
                   <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-2">
                       <Clock size={14} /> Expires
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {displayExpiration} <span className="text-zinc-400 dark:text-zinc-500">({daysRemaining} days remaining)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-2">
                       <ShieldCheck size={14} /> Status
                    </span>
                    <span className={`font-black uppercase tracking-tighter ${isPremium ? 'text-emerald-500' : 'text-[#004e92]'}`}>
                      {selectedStudentProduct?.name || activeSubscription?.productName || user.productName || (isPremium ? 'Active' : 'Free Trial')}
                    </span>
                  </div>
                </div>

                {/* Account Settings Menu */}
                {/* Account Settings Menu */}
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => window.location.href = '/student/portal'}
                    className="flex items-center justify-between w-full p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all text-sm font-semibold text-zinc-900 dark:text-zinc-100 group"
                  >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#004e92] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Settings size={16} />
                        </div>
                        Manage Account
                    </div>
                  </button>

                  <button 
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="flex items-center justify-between w-full p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all text-sm font-semibold text-zinc-900 dark:text-zinc-100 group"
                  >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Key size={16} />
                        </div>
                        Change Password
                    </div>
                  </button>
                  
                  {showPasswordChange && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="space-y-3 pt-2 pb-2 px-1"
                    >
                        <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Current Password</label>
                            <input 
                                type="password"
                                placeholder="Enter current password"
                                value={passwords.current}
                                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#004e92] dark:focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">New Password</label>
                            <input 
                                type="password"
                                placeholder="Enter new password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#004e92] dark:focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Confirm Password</label>
                            <input 
                                type="password"
                                placeholder="Re-enter new password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#004e92] dark:focus:border-blue-500 transition-colors"
                            />
                        </div>
                        {error && (
                            <div className="p-2 bg-red-50 text-red-600 rounded text-[10px] font-bold border border-red-100">
                                {error}
                            </div>
                        )}
                        <button 
                            disabled={isChanging}
                            onClick={async () => {
                                setError("");
                                if (!passwords.current || !passwords.new || !passwords.confirm) {
                                    return setError("All fields are required");
                                }
                                if (passwords.new !== passwords.confirm) {
                                    return setError("Passwords do not match");
                                }
                                if (passwords.new.length < 6) {
                                    return setError("Password must be at least 6 characters");
                                }

                                setIsChanging(true);
                                try {
                                    await changeUserPassword(user.id, passwords.current, passwords.new);
                                    alert("Password updated successfully!");
                                    setShowPasswordChange(false);
                                    setPasswords({ current: "", new: "", confirm: "" });
                                } catch (err) {
                                    setError(err?.message || err || "Failed to update password");
                                } finally {
                                    setIsChanging(false);
                                }
                            }}
                            className="w-full bg-[#004e92] text-white py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                            {isChanging ? "Updating..." : "Update Password"}
                        </button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                 <button 
                   onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center justify-center gap-2 w-full p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all text-sm font-bold uppercase tracking-[0.2em]"
                 >
                   <LogOut size={16} />
                   Log Out
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LogoutModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          const { logout } = await import("@/auth/auth.logic");
          logout();
          window.location.href = "/";
        }}
      />
    </div>
  );
}
