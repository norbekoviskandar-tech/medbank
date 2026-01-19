"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { requireAuth } from "@/auth/auth.guard";
import Sidebar from "@/components/layout/Sidebar";
import AccountDropdown from "@/components/layout/AccountDropdown";
import { LogOut, User, Menu, ShoppingCart } from "lucide-react";
import { logout } from "@/auth/auth.logic";

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    requireAuth(router);
    
    // Safety check for banned status
    const userId = localStorage.getItem("medbank_user");
    if (userId) {
      import("@/services/user.service").then(async ({ getUserById }) => {
        const user = await getUserById(userId);
        if (user?.isBanned) {
          alert("Your account has been suspended. Please contact support.");
          handleLogout();
        }
      });
    }
  }, [router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header - Modular & Clean */}
        <header className="bg-white border-b-2 border-[#1d46af] h-16 flex justify-between items-center px-4 lg:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-zinc-100 rounded transition-colors font-bold text-[#1d46af]"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Active Session / {pathname?.split('/').pop() || 'Module'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/checkout')}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-[#1d46af]"
            >
              <ShoppingCart size={18} />
            </button>
            <AccountDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#f1f5f9]">
          <div className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-zinc-200 py-3 px-8 hidden md:flex justify-between items-center text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
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
