"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import CartDropdown from "@/components/layout/CartDropdown";
import { 
  User, 
  CreditCard, 
  ChevronRight, 
  RefreshCw, 
  LogOut, 
  CheckCircle,
  Settings,
  Mail,
  ShieldCheck,
  Zap,
  Play,
  ArrowUpRight,
  Activity,
  Key,
  Lock,
  AlertCircle,
  CheckCircle2,
  ShoppingCart
} from "lucide-react";
import { getUserById, activateUserSubscription, updateUser } from '@/services/user.service';
import { changeUserPassword } from "@/auth/auth.logic";

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 transition-all duration-300 ${
        active 
          ? "bg-[#005eb8]/10 text-[#005eb8] border-r-4 border-[#005eb8]" 
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? "text-[#005eb8]" : "text-slate-400 group-hover:text-slate-600"}>
          {React.cloneElement(icon, { size: 18, strokeWidth: active ? 2.5 : 2 })}
        </span>
        <span className={`text-sm font-bold tracking-tight ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
          {label}
        </span>
      </div>
      {active && <ChevronRight size={14} className="text-[#005eb8]" />}
    </button>
  );
}

export default function PortalPage() {
  const router = useRouter();
  const { cart, isCartOpen, setIsCartOpen } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Restore tab persistence
    const savedTab = sessionStorage.getItem('medbank_portal_active_tab');
    if (savedTab) setActiveTab(savedTab);

    const userId = localStorage.getItem("medbank_user");
    if (!userId) {
      router.push("/login");
      return;
    }

    getUserById(userId).then(userData => {
      setUser(userData);
      setLoading(false);
    });
  }, [router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem('medbank_portal_active_tab', tab);
  };

  const handleLogout = () => {
    localStorage.removeItem("medbank_user");
    router.push("/");
  };

  const confirmActivation = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await activateUserSubscription(user.id);
      const updated = await getUserById(user.id);
      setUser(updated);
      // After activation, take user to student portal
      router.push('/app/dashboard');
    } catch (err) {
      console.error("Activation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!user?.expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(user.expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setIsChanging(true);
    try {
      await changeUserPassword(user.id, oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err) {
      setPasswordError(err?.message || err || "Failed to change password");
    } finally {
      setIsChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <RefreshCw size={24} className="animate-spin text-[#005eb8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 selection:bg-[#005eb8]/10 relative">
      {/* Confirmation Modal */}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 mx-auto border border-orange-100 text-orange-600">
              <Key size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Security Update</h3>
            <p className="text-center text-slate-500 text-sm font-medium mb-8">Update your account password</p>

            {passwordSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Password Updated!</h4>
                <p className="text-sm text-slate-500 mt-1">Your security has been updated successfully.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                {passwordError && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-in shake duration-300">
                    <AlertCircle size={16} />
                    {passwordError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    type="submit"
                    disabled={isChanging}
                    className="w-full py-4 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                  >
                    {isChanging ? "UPDATING..." : "UPDATE PASSWORD"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="w-full py-4 bg-white text-slate-400 text-sm font-black rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="flex items-center">
            <span className="text-2xl font-black text-[#1d46af] tracking-tight">Isky</span>
            <div className="relative ml-2 w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[2.5px] border-[#1d46af]"></div>
              <div className="absolute inset-[3px] rounded-full border border-amber-400 opacity-80"></div>
              <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              <span className="text-[#1d46af] font-black text-[12px] tracking-tighter">MD</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
             <button 
               onClick={() => setIsCartOpen(!isCartOpen)}
               className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-[#005eb8] relative"
             >
               <div className="relative">
                 <ShoppingCart size={18} />
                 {cart.length > 0 && (
                   <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#1d46af] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                     {cart.length}
                   </span>
                 )}
               </div>
               <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Cart</span>
             </button>
             <CartDropdown />
           </div>
           <button 
             onClick={() => window.location.reload()}
             className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-[#005eb8]"
           >
             <RefreshCw size={18} />
           </button>
           <div className="h-8 w-px bg-slate-200" />
           <button 
             onClick={handleLogout}
             className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
           >
             <LogOut size={16} />
             SIGN OUT
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Management Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 animate-in fade-in slide-in-from-left duration-500">
          <div className="p-8 pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#005eb8]">Your Products</p>
          </div>
          
          <nav className="flex-1">
            <NavItem 
              icon={<CreditCard />} 
              label="Subscriptions" 
              active={activeTab === 'subscriptions'} 
              onClick={() => handleTabChange('subscriptions')}
            />
            <NavItem 
              icon={<User />} 
              label="Student Profile" 
              active={activeTab === 'profile'} 
              onClick={() => handleTabChange('profile')}
            />

          </nav>


        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            
            {/* Content Tabs */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === 'subscriptions' && (
                <div className="flex flex-col py-12 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="w-full max-w-3xl px-12">
                      <h2 className="text-[19px] font-bold text-slate-800 mb-5 pl-1">Medical Subscriptions</h2>
                      
                      <div className="bg-white rounded-xl border border-slate-200 group hover:bg-slate-50 transition-all p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                            <Activity size={20} />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                               <h3 className="text-[17px] font-bold text-slate-900 leading-tight">ECG QBank</h3>
                               {user?.subscriptionStatus !== 'active' && !user?.purchased && (
                                 <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                   Free Trial
                                 </span>
                               )}
                            </div>
                            <p className="text-[13px] text-[#005eb8] mt-0.5 font-medium">
                              {user?.subscriptionStatus === 'active' 
                                ? `Access expires: ${new Date(user.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` 
                                : user?.purchased
                                  ? 'Ready to Activate'
                                  : 'Trial Period Active'}
                            </p>
                          </div>
                        </div>

                          <div className="flex items-center gap-2">
                           {/* Activate Button - Show if: 
                               1. Not active
                               2. Purchased but current activation is not by purchase (i.e. it's a trial) */}
                           {(user?.subscriptionStatus !== 'active' || (user?.purchased && !user?.activatedByPurchase)) && (
                             <div className="relative flex flex-col items-center">
                               <button 
                                 onClick={confirmActivation}
                                 className={`h-9 px-6 text-[13px] font-black rounded-full transition-all border-2 active:scale-95 ${
                                   user?.purchased 
                                     ? 'bg-emerald-50 text-emerald-600 border-emerald-500/40 hover:bg-emerald-100 animate-pulse' 
                                     : 'bg-blue-50 text-[#005eb8] border-[#005eb8]/30 hover:bg-blue-100'
                                 }`}
                               >
                                 {user?.purchased && user?.subscriptionStatus === 'active' ? 'ACTIVATE FULL ACCESS' : 'ACTIVATE'}
                               </button>
                               {!user?.purchased && (
                                 <span className="absolute top-full mt-1 text-[10px] font-bold text-blue-400 whitespace-nowrap">
                                   3 day activation
                                 </span>
                               )}
                             </div>
                           )}

                          {/* Upgrade Button - Show before purchase */}
                          {!user?.purchased && (
                            <button 
                              onClick={() => {
                                addToCart({
                                  id: "ecg-qbank",
                                  title: "ECG Qbank",
                                  subtitle: "Precision Electrocardiography",
                                  description: "Master the art of ECG interpretation with 2,000+ high-fidelity rhythm strips, complex case studies, and real-time wave analysis.",
                                  icon: <Activity className="text-white" size={24} />,
                                  color: "bg-rose-500",
                                  features: [
                                    "2,000+ Rhythm Strips",
                                    "Interactive Wave Analysis", 
                                    "Dynamic Case Studies",
                                    "Step-by-Step Interpretations",
                                    "Real-time Performance Metrics"
                                  ]
                                });
                                router.push("/checkout");
                              }}
                              className="h-9 px-5 bg-amber-50 border-2 border-amber-500/30 text-amber-600 text-[13px] font-bold rounded-full hover:bg-amber-100 transition-all flex items-center gap-2"
                            >
                              UPGRADE <ArrowUpRight size={14} />
                            </button>
                          )}
                          
                          {/* Renew Button - Show if active, paid, and <= 5 days left */}
                          {user?.subscriptionStatus === 'active' && user?.activatedByPurchase && daysLeft <= 5 && (
                            <button 
                              onClick={() => {
                                addToCart({
                                  id: "ecg-qbank",
                                  title: "ECG Qbank",
                                  subtitle: "Precision Electrocardiography",
                                  description: "Master the art of ECG interpretation with 2,000+ high-fidelity rhythm strips, complex case studies, and real-time wave analysis.",
                                  icon: <Activity className="text-white" size={24} />,
                                  color: "bg-rose-500",
                                  features: [
                                    "2,000+ Rhythm Strips",
                                    "Interactive Wave Analysis", 
                                    "Dynamic Case Studies",
                                    "Step-by-Step Interpretations",
                                    "Real-time Performance Metrics"
                                  ]
                                });
                                router.push("/checkout");
                              }}
                              className="h-9 px-6 bg-orange-50 border-2 border-orange-500/30 text-orange-600 text-[13px] font-black rounded-full hover:bg-orange-100 transition-all active:scale-95 animate-pulse"
                            >
                              RENEW ({daysLeft} days left)
                            </button>
                          )}

                          {/* Launch Button - Show if active AND (if they purchased, it must be the purchased activation) 
                              UNLESS it's a renewal case (we want them to see Renew, but Launch is also okay. 
                              Let's show both if they have few days left, or prioritize Launch? 
                              Usually you show both.) */}
                          {user?.subscriptionStatus === 'active' && (!user?.purchased || user?.activatedByPurchase) && (
                            <button 
                              onClick={() => router.push('/app/dashboard')}
                              className="h-9 px-6 bg-blue-50 text-[#005eb8] border-2 border-[#005eb8]/30 text-[13px] font-black rounded-full hover:bg-blue-100 transition-all active:scale-[0.98]"
                            >
                              Launch
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Purchased products info */}
                      {user?.purchased && user?.subscriptionStatus !== 'active' && (
                        <div className="mt-8 p-6 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex items-start gap-4 animate-in slide-in-from-top-2 duration-500">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#005eb8] flex items-center justify-center shrink-0">
                            <Zap size={20} fill="currentColor" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 mb-1">Product Ready for Activation</p>
                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                              You have successfully purchased the **ECG QBank**. Click the green **Activate** button above to start your 90-day access period.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              )}


              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">Personal Information</h2>
                    <div className="space-y-8">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Student Name</label>
                         <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#005eb8]">
                               <User size={20} />
                            </div>
                            <span className="text-lg font-bold text-slate-700">{user?.name || "Student User"}</span>
                         </div>
                      </div>
                      
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Email Address</label>
                         <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#005eb8]">
                               <Mail size={20} />
                            </div>
                            <span className="text-lg font-bold text-slate-700">{user?.email}</span>
                         </div>
                      </div>

                      <div className="pt-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Security</label>
                         <button
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group"
                         >
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                  <Key size={20} />
                               </div>
                               <span className="text-lg font-bold text-slate-700">Change Password</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#1e293b] text-slate-400 py-12 px-6 mt-12">
        <div className="max-w-6xl mx-auto text-center">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest border-t border-slate-700 pt-8">
             <span>© 2026 IskyMD Universal Systems. All rights reserved.</span>
             <div className="flex gap-4">
                <button className="px-3 py-1 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">Manage Cookies</button>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
