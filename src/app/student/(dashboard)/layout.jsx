"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { requireAuth } from "@/auth/auth.guard";
import Sidebar from "@/components/student/layout/Sidebar";
import AccountDropdown from "@/components/student/layout/AccountDropdown";
import { LogOut, User, Menu, ShoppingCart, Sun, Moon } from "lucide-react";
import { logout } from "@/auth/auth.logic";
import { AppContext } from "@/context/AppContext";
import { useContext } from "react";
import { getPublishedProducts } from "@/services/product.service";
import { ChevronDown, Package } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { theme, toggleTheme, selectedStudentProduct, setGlobalStudentProduct, setAvailableStudentProducts, availableStudentProducts } = useContext(AppContext);
  const [showVaultSwitcher, setShowVaultSwitcher] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    requireAuth(router);
    
    // Safety check for banned status and expiration
    const userId = localStorage.getItem("medbank_user");
    if (userId) {
      import("@/services/user.service").then(async ({ getUserById }) => {
        const userData = await getUserById(userId);
        setUser(userData);
        if (userData?.isBanned) {
          alert("Your account has been suspended. Please contact support.");
          handleLogout();
          return;
        }

        // Role-based isolation
        const effectiveRole = String(userData?.role || '').toLowerCase().trim();
        if (effectiveRole === 'author') {
           console.log(`[Student Portal] Role: ${effectiveRole} detected. Authors are restricted to the author portal. Redirecting...`);
           router.push("/author");
           return;
        }
        
        console.log(`[Student Portal] Role: ${effectiveRole} access permitted.`);

        // Expiration check
        if (userData?.expiresAt) {
          const now = new Date();
          const expiry = new Date(userData.expiresAt);
          if (expiry <= now) {
            router.push("/student/portal");
            return;
          }
        }
      });
    }
  }, [router, pathname]);

  // Load authorized subcriptions (vaults) for the student
  useEffect(() => {
    if (!user) return;
    
    import("@/services/user.service").then(m => {
      m.getUserSubscriptions(user.id).then(subs => {
        // Map active subscriptions to product-like objects for the UI
        const activeSubs = subs.filter(s => s.status === 'active').map(s => ({
          subscriptionId: s.id,
          id: s.packageId, // used for API scoping
          name: s.productName || 'Medical QBank',
          expiresAt: s.expiresAt,
          durationDays: s.durationDays
        }));

        setAvailableStudentProducts(activeSubs);
        
        // Enforce selection
        if (!selectedStudentProduct && activeSubs.length > 0) {
          setGlobalStudentProduct(activeSubs[0]);
        }
      });
    });
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handle = () => setShowVaultSwitcher(false);
    if (showVaultSwitcher) window.addEventListener('click', handle);
    return () => window.removeEventListener('click', handle);
  }, [showVaultSwitcher]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isRenewalTime = () => {
    if (user?.hasPendingPurchase || (user?.purchased && !user?.activatedByPurchase)) return false;
    if (!user?.activatedAt || !user?.expiresAt || user.subscriptionStatus !== 'active') return false;
    
    const expiry = new Date(user.expiresAt).getTime();
    const now = new Date().getTime();
    const remaining = expiry - now;
    
    if (remaining <= 0) return false;

    // Show when 5 days or less remain (5 * 24 * 60 * 60 * 1000)
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    
    return remaining <= fiveDaysMs;
  };

  const showRenew = isRenewalTime();
  const getDaysLeft = () => {
    if (!user?.expiresAt) return 0;
    const diff = new Date(user.expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };
  const daysLeft = getDaysLeft();

  useEffect(() => {
    if (user?.subscriptionStatus !== 'active' || !user?.expiresAt) return;
    const update = () => {
      const diff = new Date(user.expiresAt) - new Date();
      if (diff <= 0) setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      else setTimeRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [user?.expiresAt, user?.subscriptionStatus, user?.activatedAt]);

  return (
    <div className={`flex h-screen overflow-hidden bg-[#f1f5f9] dark:bg-[#0F0F12] transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header - Modular & Clean */}
        <header className="bg-white dark:bg-[#16161a] border-b-2 border-[#1d46af] dark:border-blue-500/30 h-16 flex justify-between items-center px-4 lg:px-8 flex-shrink-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-zinc-100 rounded transition-colors font-bold text-[#1d46af]"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-widest leading-none mb-1">Active Session / {pathname?.split('/').pop() || 'Module'}</p>
              
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setShowVaultSwitcher(!showVaultSwitcher)}
                  className="flex items-center gap-2 text-[#1B263B] dark:text-zinc-200 font-bold text-xs hover:text-[#1d46af] dark:hover:text-blue-400 transition-colors"
                >
                  <Package size={14} className="text-[#1d46af] dark:text-blue-500" />
                  {selectedStudentProduct ? selectedStudentProduct.name : 'Select Vault'}
                  <ChevronDown size={12} className={`text-zinc-400 transition-transform duration-300 ${showVaultSwitcher ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showVaultSwitcher && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1C1C21] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                    >
                      <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                        {availableStudentProducts.length === 0 ? (
                          <div className="p-4 text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">No Authorized Vaults</div>
                        ) : (
                          availableStudentProducts.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setGlobalStudentProduct(p);
                                setShowVaultSwitcher(false);
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${selectedStudentProduct?.id === p.id ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${selectedStudentProduct?.id === p.id ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                              {p.name}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-[#64748b] dark:text-[#94a3b8]"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <AccountDropdown />
          </div>
        </header>

        {user?.subscriptionStatus === 'active' && user?.expiresAt && showRenew && (
           <div className="w-full bg-[#2196f3] py-4 px-6 flex items-center justify-center animate-in slide-in-from-top-4 duration-500 shadow-lg z-10 border-b border-white/10">
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#f1f5f9] dark:bg-[#0F0F12] transition-colors duration-300">
          <div className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-[#16161a] border-t border-zinc-200 dark:border-zinc-800 py-3 px-8 hidden md:flex justify-between items-center text-[10px] font-bold text-[#94a3b8] dark:text-[#64748b] uppercase tracking-widest transition-colors duration-300">
          <div>© 2026 IskyMD Universal Systems</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#1d46af]">Privacy Policy</a>
            <a href="#" className="hover:text-[#1d46af]">Terms of End User License</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
