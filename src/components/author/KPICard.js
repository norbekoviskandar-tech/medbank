"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

const KPICard = ({
    title,
    value,
    secondaryValue,
    trend,
    trendData = [],
    icon: Icon,
    color = "text-primary",
    insight = "Performance steady",
    benchmark = "Above industry avg"
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isPositive = !trend.startsWith('-');

    // Custom Sparkline Logic
    const generateSparklinePath = (data) => {
        if (!data || data.length === 0) return "";
        const width = 80;
        const height = 30;
        const padding = 2;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - padding * 2) - padding;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    // Color map based on specified themes
    const themeColors = {
        "text-[#8B5CF6]": { hex: "#8B5CF6", bg: "bg-[#8B5CF6]/10", border: "border-[#8B5CF6]/20" },
        "text-[#06B6D4]": { hex: "#06B6D4", bg: "bg-[#06B6D4]/10", border: "border-[#06B6D4]/20" },
        "text-[#10B981]": { hex: "#10B981", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20" },
        "text-[#F59E0B]": { hex: "#F59E0B", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20" },
    };

    const currentTheme = themeColors[color] || { hex: "#8B5CF6", bg: "bg-primary/10", border: "border-primary/20" };

    return (
        <motion.div
            layout
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`cyber-card p-6 flex flex-col gap-4 group cursor-pointer border ${isExpanded ? currentTheme.border : 'border-white/5'} transition-all duration-300`}
        >
            <div className="flex items-center justify-between">
                <motion.div
                    whileHover={{ rotate: [-10, 10, -10] }}
                    className={`p-3 rounded-2xl ${currentTheme.bg} border border-white/5`}
                >
                    <Icon className={color} size={24} />
                </motion.div>

                {/* Custom Sparkline */}
                <div className="h-[30px] w-[80px]">
                    <svg width="80" height="30" viewBox="0 0 80 30" className="overflow-visible">
                        <defs>
                            <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={currentTheme.hex} stopOpacity="1" />
                                <stop offset="100%" stopColor={currentTheme.hex} stopOpacity="0.3" />
                            </linearGradient>
                        </defs>
                        <motion.path
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            d={generateSparklinePath(trendData)}
                            fill="none"
                            stroke={`url(#gradient-${title.replace(/\s+/g, '')})`}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Dot indicator on last point */}
                        {trendData.length > 0 && (
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.5 }}
                                cx="80"
                                cy={30 - ((trendData[trendData.length - 1] - Math.min(...trendData)) / (Math.max(...trendData) - Math.min(...trendData) || 1)) * 26 - 2}
                                r="3"
                                fill={currentTheme.hex}
                                className="pulse-glow"
                            />
                        )}
                    </svg>
                </div>
            </div>

            <div>
                <p className="text-gray-500 text-xs font-heading font-bold uppercase tracking-widest">{title}</p>
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                        <motion.h3
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-2xl font-mono font-bold text-white tracking-tight"
                        >
                            {value}
                        </motion.h3>
                        {secondaryValue && (
                            <>
                                <span className="text-gray-600 text-xl font-mono">/</span>
                                <span className="text-xl font-mono font-bold text-primary tracking-tight">{secondaryValue}</span>
                            </>
                        )}
                    </div>
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-100'}`}
                    >
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                        className="overflow-hidden pt-4 border-t border-white/5 space-y-3"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Instant Insight</span>
                            <p className="text-xs text-gray-300 font-medium">{insight}</p>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-600 font-bold uppercase">Benchmark</span>
                                <span className="text-[10px] text-primary font-bold">{benchmark}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-gray-500">
                                <span>details</span>
                                <TrendingUp size={10} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-center">
                <div className={`mt-2 text-gray-600 group-hover:text-gray-400 transition-colors`}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </div>
        </motion.div>
    );
};

export default KPICard;
