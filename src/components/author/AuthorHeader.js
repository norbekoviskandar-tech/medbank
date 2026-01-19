"use client";
import React, { useContext } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, User, Sun, Moon, Menu, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppContext } from '@/context/AppContext';

const AuthorHeader = () => {
    const { theme, toggleTheme, toggleSidebar } = useContext(AppContext);
    const pathname = usePathname();

    const showThemeToggle = pathname === '/author/manage-questions' || pathname === '/author/create-question';

    return (
        <header className="sticky top-0 z-40 w-full bg-background/60 backdrop-blur-xl border-b border-border/50 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer group">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-gray-500 hover:text-primary transition-all border border-border"
                >
                    <Menu size={20} />
                </button>
                <div className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] group-hover:text-primary transition-colors hidden sm:block">
                    Dashboard / <span className="text-foreground font-bold">Analytics_Node.01</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:flex items-center gap-3 bg-accent/10 border border-border rounded-2xl px-4 py-2 hover:border-primary/30 transition-all group">
                    <Search size={16} className="text-gray-500 group-hover:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search system data..."
                        className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-gray-500 w-48 focus:w-64 transition-all"
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded-md bg-accent/20 text-[10px] text-gray-500 font-mono">⌘</kbd>
                        <kbd className="px-1.5 py-0.5 rounded-md bg-accent/20 text-[10px] text-gray-500 font-mono">K</kbd>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    {showThemeToggle && (
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-2xl bg-accent/10 hover:bg-accent/20 text-gray-500 hover:text-foreground transition-all border border-border"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    )}

                    <button className="p-2.5 rounded-2xl bg-accent/10 hover:bg-accent/20 text-gray-500 hover:text-foreground transition-all relative border border-border">
                        <Bell size={20} />
                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background"></div>
                    </button>

                    <button 
                        onClick={() => window.location.reload()}
                        className="p-2.5 rounded-2xl bg-accent/10 hover:bg-accent/20 text-gray-500 hover:text-foreground transition-all border border-border"
                        title="Refresh Page"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <div className="h-8 w-[1px] bg-border/50 mx-2"></div>

                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs font-bold text-foreground">MedBank Admin</div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">Verified_Auth</div>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/20 to-[#06B6D4]/20 border border-border flex items-center justify-center text-gray-400 overflow-hidden cursor-pointer"
                        >
                            <User size={20} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AuthorHeader;
