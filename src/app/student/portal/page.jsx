"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import CartDropdown from "@/components/student/layout/CartDropdown";
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
  ArrowRight,
  Activity,
  Key,
  Lock,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  MessageSquare
} from "lucide-react";
import { getUserById, activateUserSubscription, updateUser, submitFeedback } from '@/services/user.service';
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
  const { cart, isCartOpen, setIsCartOpen, addToCart } = useContext(AppContext);
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

  const [subscriptions, setSubscriptions] = useState([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  
  useEffect(() => {
    // Restore tab persistence
    const savedTab = sessionStorage.getItem('medbank_portal_active_tab');
    if (savedTab) setActiveTab(savedTab);

    const userId = localStorage.getItem("medbank_user");
    if (!userId) {
      router.push("/auth");
      return;
    }

    getUserById(userId).then(userData => {
      setUser(userData);
      import("@/services/user.service").then(m => {
        m.getUserSubscriptions(userId).then(subs => {
          setSubscriptions(subs);
          setLoading(false);
        });
      });
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

  const handleSubmitFeedback = async () => {
    const clean = String(feedbackText || "").trim();
    if (!clean) {
      setFeedbackError("Please write feedback before sending.");
      return;
    }
    if (clean.length > 500) {
      setFeedbackError("Feedback is limited to 500 characters.");
      return;
    }

    setIsSendingFeedback(true);
    setFeedbackError("");
    setFeedbackSuccess(false);
    try {
      await submitFeedback({
        userId: user?.id || localStorage.getItem("medbank_user"),
        message: clean,
        source: "portal",
        page: "/student/portal"
      });
      setFeedbackText("");
      setFeedbackSuccess(true);
    } catch (error) {
      setFeedbackError(error?.message || "Failed to send feedback.");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const { setGlobalStudentProduct } = useContext(AppContext);

  const handleLaunchSubscription = (sub) => {
    // Map subscription record to product context
    const productContext = {
      subscriptionId: sub.id,
      id: sub.packageId,
      name: sub.productName || 'Medical QBank',
      expiresAt: sub.expiresAt,
      durationDays: sub.durationDays
    };
    setGlobalStudentProduct(productContext);
    router.push('/student/dashboard');
  };


  const getDaysLeft = () => {
    if (!user?.expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(user.expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft();

  // Renewal Logic: Check if within last 5 days
  const isRenewalTime = () => {
    // Suppress renewal warnings if we are in "Ready to Activate" state (pending purchase)
    if (user?.hasPendingPurchase || (user?.purchased && !user?.activatedByPurchase)) return false;

    if (!user?.activatedAt || !user?.expiresAt || user.subscriptionStatus !== 'active') return false;
    
    const end = new Date(user.expiresAt).getTime();
    const now = new Date().getTime();
    const remaining = end - now;
    
    // Show when 5 days or less remain (5 * 24 * 60 * 60 * 1000)
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    
    return remaining > 0 && remaining <= fiveDaysMs;
  };

  const showRenew = isRenewalTime();

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
            <NavItem
              icon={<MessageSquare />}
              label="Feedback"
              active={activeTab === 'feedback'}
              onClick={() => handleTabChange('feedback')}
            />

          </nav>


        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            
            {/* Renewal Countdown Banner - Only show for paid subscribers with 10s delay */}
            {user?.subscriptionStatus === 'active' && user?.expiresAt && showRenew && (
               <div className="mb-8 w-full bg-[#2196f3] py-4 px-6 flex items-center justify-center animate-in slide-in-from-top-4 duration-500 shadow-lg rounded-2xl border-b border-white/10">
                 <div className="flex items-center gap-3 text-white font-extrabold text-[13px] md:text-sm tracking-tight text-center">
                   <span>You have</span>
                   <div className="flex items-center justify-center w-7 h-7 bg-zinc-900 rounded-full text-[12px] text-white shrink-0 shadow-lg">
                     {daysLeft}
                   </div>
                   {user?.activatedByPurchase || user?.purchased || user?.hasPendingPurchase ? (
                     <span>days left on your subscription. Renew today to keep your access.</span>
                   ) : (
                     <span>days left on your free trial. Upgrade today to unlock the full QBank.</span>
                   )}
                 </div>
               </div>
            )}

            {/* Content Tabs */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === 'subscriptions' && (
                <div className="flex flex-col py-12 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="w-full max-w-3xl px-12">
                      {subscriptions.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center mb-8 pl-1">
                            <div>
                              <h2 className="text-[22px] font-black text-slate-800 tracking-tight">Active Vaults</h2>
                              <p className="text-sm font-medium text-slate-400">Launch your products from here</p>
                            </div>
                            <button 
                              onClick={() => router.push('/products')}
                              className="h-10 px-5 bg-blue-50 text-[#1d46af] border border-blue-100 text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-blue-100 transition-all flex items-center gap-2"
                            >
                              Browse More <ArrowUpRight size={16} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {subscriptions.map((sub) => {
                              const isActive = sub.status === 'active' && new Date(sub.expiresAt) > new Date();
                              const isExpired = sub.status === 'expired' || (sub.expiresAt && new Date(sub.expiresAt) <= new Date());
                              
                              return (
                                <div key={sub.id} className="bg-white rounded-2xl border border-slate-200 group hover:border-[#1d46af]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${isActive ? 'bg-blue-500' : 'bg-slate-200'} flex items-center justify-center text-white shrink-0 shadow-lg ${isActive ? 'shadow-blue-500/20' : ''}`}>
                                      <Activity size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                                          {sub.productName}
                                        </h3>
                                        {isActive && (
                                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tight">
                                            Active
                                          </span>
                                        )}
                                        {isExpired && (
                                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 uppercase tracking-tight">
                                            Expired
                                          </span>
                                        )}
                                      </div>
                                      <p className={`text-[13px] mt-0.5 font-bold ${isExpired ? 'text-red-400' : 'text-slate-400'}`}>
                                        {isActive 
                                          ? `Expires: ${new Date(sub.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                          : isExpired 
                                            ? 'Subscription expired'
                                            : 'Ready to Activate'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {isActive ? (
                                      <button 
                                        onClick={() => handleLaunchSubscription(sub)}
                                        className="h-10 px-8 bg-[#1d46af] text-white text-[13px] font-black rounded-full hover:bg-[#16368a] transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                                      >
                                        Launch <Play size={14} fill="white" />
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => router.push('/products')}
                                        className="h-10 px-6 bg-slate-50 text-slate-400 text-[13px] font-black rounded-full border border-slate-200 hover:bg-slate-100 transition-all"
                                      >
                                        Renew Access
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
                          <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 text-slate-300">
                            <ShoppingCart size={40} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">No Active Vaults</h3>
                          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                            Your purchased medical QBanks will appear here. Explore our products to get started.
                          </p>
                          <button 
                            onClick={() => router.push('/products')}
                            className="h-16 px-10 bg-[#1d46af] text-white text-base font-black rounded-2xl hover:bg-[#16368a] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3 group"
                          >
                            Explore Products <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                          </button>
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

              {activeTab === 'feedback' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Feedback</h2>
                    <p className="text-sm text-slate-500 mb-6">Share issues or suggestions. Max 500 characters.</p>

                    <textarea
                      value={feedbackText}
                      onChange={(e) => {
                        setFeedbackText(e.target.value.slice(0, 500));
                        if (feedbackSuccess) setFeedbackSuccess(false);
                      }}
                      rows={7}
                      className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#005eb8]"
                      placeholder="Write your feedback here..."
                    />

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-red-500">{feedbackError}</span>
                      <span className="text-slate-400">{feedbackText.length}/500</span>
                    </div>

                    {feedbackSuccess && (
                      <p className="mt-3 text-xs font-bold text-emerald-600">Feedback sent successfully.</p>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={isSendingFeedback}
                        className="px-5 py-3 rounded-xl bg-[#1d46af] text-white text-sm font-black uppercase tracking-wider disabled:opacity-50"
                      >
                        {isSendingFeedback ? 'Sending...' : 'Send Feedback'}
                      </button>
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
