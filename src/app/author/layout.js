"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContext } from "@/context/AppContext";
import {
  BarChart3,
  Users,
  TrendingUp,
  Filter,
  Database,
  LayoutDashboard,
  LogOut,
  Shield,
  ChevronDown
} from "lucide-react";
import AuthorHeader from "@/components/author/AuthorHeader";

export default function AuthorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { sidebarCollapsed, setSidebarCollapsed } = useContext(AppContext);

  useEffect(() => {
    // Responsive collapse
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/author' },
    { label: 'Users', icon: Users, href: '/author/users' },
    { label: 'Engagement', icon: Users, href: '/author/engagement' },
    { label: 'Retention', icon: TrendingUp, href: '/author/retention' },
    { label: 'Funnels', icon: Filter, href: '/author/funnel' },
    {
      label: 'Q Bank',
      icon: Database,
      href: '/author/manage-questions',
      children: [
        { label: 'Question Bank Management', href: '/author/manage-questions' },
        { label: 'Create Questions', href: '/author/create-question' },
      ]
    },
  ];

  useEffect(() => {
    // Check auth
    if (typeof window !== "undefined") {
      const unlocked = localStorage.getItem("medbank-author-unlocked");
      if (unlocked !== "true" && pathname !== "/author") {
        router.push("/author");
      } else {
        setLoading(false);
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    // Auto-open dropdown if child is active
    navItems.forEach(item => {
      if (item.children && item.children.some(child => pathname === child.href)) {
        setOpenDropdown(item.label);
      }
    });
  }, [pathname]);

  if (loading && pathname !== "/author") {
    return (
      <div className="min-h-screen cyber-theme flex items-center justify-center p-6 cyber-mesh">
        <div className="text-[#8B5CF6] font-mono text-xl animate-pulse tracking-[0.5em] font-bold">
          SECURITY_CHECK...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen cyber-theme cyber-mesh transition-all duration-500 overflow-hidden">
      {/* Mobile Overlay */}
      <div 
        onClick={() => setSidebarCollapsed(true)}
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${!sidebarCollapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen flex flex-col gap-10 bg-[#0F0F12]/80 backdrop-blur-3xl border-r border-white/5 p-6 transition-all duration-500 z-50 
          ${sidebarCollapsed 
            ? '-translate-x-full lg:translate-x-0 lg:w-24 px-4' 
            : 'translate-x-0 w-72 p-8'
          }`}
      >
        <div className={`flex items-center gap-4 group cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] p-[1px] shadow-[0_0_30px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all">
            <div className="w-full h-full rounded-2xl bg-[#0F0F12] flex items-center justify-center">
              <Shield className="text-white w-6 h-6" />
            </div>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h2 className="font-heading font-black text-xl text-white tracking-widest uppercase">Admin<span className="text-[#8B5CF6]">Panel</span></h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">System_Secure</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex flex-col gap-2 mt-4 flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4 ml-4 whitespace-nowrap"
              >
                Main Menu
              </motion.div>
            )}
          </AnimatePresence>

          {navItems.map((item, idx) => {
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children.some(child => pathname === child.href);
            const isActive = pathname === item.href || isChildActive;
            const isOpen = openDropdown === item.label && !sidebarCollapsed;

            return (
              <div key={idx} className="flex flex-col gap-1">
                <div
                  onClick={() => hasChildren ? setOpenDropdown(isOpen ? null : item.label) : router.push(item.href)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden cursor-pointer ${sidebarCollapsed ? 'justify-center px-0 w-full' : ''
                    } ${isActive
                      ? "bg-[#8B5CF6]/10 text-white border border-[#8B5CF6]/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                      : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                    }`}
                >
                  <item.icon size={20} className={isActive ? "text-[#8B5CF6]" : "group-hover:text-white transition-colors flex-shrink-0"} />

                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-sm font-semibold tracking-wide whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {!sidebarCollapsed && hasChildren && (
                    <div className={`ml-auto transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown size={16} />
                    </div>
                  )}
                  {!sidebarCollapsed && !hasChildren && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]" />
                  )}
                  {sidebarCollapsed && isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8B5CF6] rounded-l-full shadow-[0_0_15px_#8B5CF6]" />
                  )}
                </div>

                <AnimatePresence>
                  {hasChildren && isOpen && !sidebarCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden flex flex-col gap-1 ml-9"
                    >
                      {item.children.map((child, cIdx) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={cIdx}
                            href={child.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isChildActive
                              ? "text-white font-bold"
                              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                              }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${isChildActive ? 'bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]' : 'bg-gray-700'}`} />
                            <span className="text-xs">{child.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 to-transparent border border-white/5 flex flex-col gap-3"
              >
                <div className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-widest leading-none">Global Stats</div>
                <div className="text-xl font-mono font-bold text-white tracking-tight">24.5k <span className="text-xs text-gray-500">Users</span></div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => {
              localStorage.removeItem("medbank-author-unlocked");
              router.push("/author");
            }}
            className={`flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all text-sm font-semibold ${sidebarCollapsed ? 'justify-center px-0' : ''
              }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-background">
        <AuthorHeader />
        <div className="relative">
          {children}
        </div>
      </main>
    </div>
  );
}
