"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  History,
  BarChart3,
  User,
  LogOut,
  BookOpen,
  PlusSquare,
  Play,
  CheckSquare,
  ChevronRight
} from "lucide-react";
import { logout } from "@/auth/auth.logic";
import LogoutModal from "@/components/ui/LogoutModal";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [qbankOpen, setQbankOpen] = useState(pathname.startsWith("/app/qbank") || pathname.startsWith("/app/tests"));

  const isActive = (path) => pathname.startsWith(path);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 flex-col bg-[#1d46af] text-white h-screen border-r border-[#16368a] transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1d46af]/10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[2.5px] border-white"></div>
              <div className="absolute inset-[3px] rounded-full border border-amber-400 opacity-80"></div>
              <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              <span className="text-white font-black text-[12px] tracking-tighter">MD</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider uppercase">ISKY<span className="text-amber-400">MD</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 underline decoration-amber-400/30 underline-offset-4">Education Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Navigation</p>
          </div>
          
          <NavItem
            href="/app/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={isActive("/app/dashboard")}
          />
          
          {/* Expandable QBank */}
          <div>
            <button
              onClick={() => setQbankOpen(!qbankOpen)}
              className={`w-full group flex items-center gap-3 px-6 py-3.5 transition-all relative ${isActive("/app/qbank") || isActive("/app/tests")
                ? "bg-[#16368a] text-white border-l-4 border-amber-400"
                : "text-white/70 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
              }`}
            >
              <span className={`${isActive("/app/qbank") || isActive("/app/tests") ? "text-amber-400" : "text-white/40 group-hover:text-white/70"}`}>
                <BookOpen size={18} />
              </span>
              <span className="text-[13px] font-medium tracking-wide">Question Bank</span>
              <div className={`ml-auto transition-transform ${qbankOpen ? "rotate-90" : ""}`}>
                <ChevronRight size={14} className="text-white/30" />
              </div>
            </button>
            
            {qbankOpen && (
              <div className="bg-black/10 py-1 animate-in slide-in-from-top-2 duration-200">
                <SubNavItem
                  href="/app/qbank/create-test"
                  label="Create Test"
                  active={isActive("/app/qbank/create-test")}
                />
                <SubNavItem
                  href="/app/tests"
                  label="Previous Tests"
                  active={isActive("/app/tests")}
                />
              </div>
            )}
          </div>

          <NavItem
            href="/app/performance"
            icon={<BarChart3 size={18} />}
            label="Performance"
            active={isActive("/app/performance")}
          />
          <NavItem
            href="/app/planner"
            icon={<Calendar size={18} />}
            label="Study Planner"
            active={isActive("/app/planner")}
          />


        </nav>

        <div className="p-6 border-t border-white/5 mt-auto bg-black/10 pt-8">
            <CompactProfileFooter />
        </div>
      </aside>
    </>
  );
}

function NavItem({ href, icon, label, active }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-6 py-3.5 transition-all relative ${active
          ? "bg-[#1d46af]/20 text-white border-l-4 border-amber-400"
          : "text-white/70 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
        }`}
    >
      <span className={`${active ? "text-amber-400" : "text-white/40 group-hover:text-white/70"}`}>
        {icon}
      </span>
      <span className="text-[13px] font-medium tracking-wide">{label}</span>
      {active && (
        <div className="ml-auto">
          <ChevronRight size={14} className="text-white/30" />
        </div>
      )}
    </Link>
  );
}

function SubNavItem({ href, label, active }) {
  const handleClick = () => {
    localStorage.setItem("medbank_last_qbank_view", href);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`flex items-center gap-3 pl-14 py-2.5 transition-all ${active
          ? "text-white font-bold"
          : "text-white/50 hover:text-white hover:bg-white/5"
        }`}
    >
      <div className={`w-1 h-1 rounded-full ${active ? "bg-amber-400 scale-125" : "bg-white/20"}`} />
      <span className="text-[12px] tracking-wide">{label}</span>
      {active && <div className="ml-auto pr-6"><ChevronRight size={12} className="text-white/20" /></div>}
    </Link>
  );
}

function CompactProfileFooter() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("medbank_user");
    if (userId) {
      import("@/services/user.service").then(({ getUserById }) => {
        getUserById(userId).then(setUser);
      });
    }
  }, []);

  if (!user) return null;

  const joinDate = new Date(user.createdAt || Date.now());
  const trialExpiration = new Date(joinDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const expirationDate = user.expiresAt ? new Date(user.expiresAt) : trialExpiration;

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-white font-bold text-xs border border-white/5 flex-shrink-0">
        {user.name?.charAt(0) || "U"}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Subscription Expires</p>
        <p className="text-[11px] font-bold text-amber-400 tracking-wide truncate">
          {expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
