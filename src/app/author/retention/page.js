"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Repeat, Calendar, Clock, TrendingUp, Users, PieChart, Lightbulb,
    Download, RefreshCw, ChevronDown, CalendarDays, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

import { getRetentionData, getDashboardStats } from '@/services/analytics.service';

const RetentionPage = () => {
    const [activeTab, setActiveTab] = useState('cohorts');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cohortData, setCohortData] = useState([]);
    const [stats, setStats] = useState({
        day1: "0%",
        day7: "0%",
        day30: "0%",
        avgSession: "0m"
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsRefreshing(true);
        try {
            const data = await getRetentionData();
            const dashStats = await getDashboardStats();
            setCohortData(data);

            // Derive KPIs from cohort data
            const latestCohort = data[0];
            if (latestCohort) {
                setStats({
                    day1: `${latestCohort.retention[1]}%`,
                    day7: `${latestCohort.retention[2]}%`,
                    day30: `${latestCohort.retention[4]}%`,
                    avgSession: dashStats.avgSession
                });
            }
        } catch (err) {
            console.error("Failed to load retention data:", err);
        }
        setIsRefreshing(false);
    };

    const handleRefresh = () => {
        loadData();
    };

    const kpis = [
        { title: "Day 1 Retention", value: stats.day1, trend: "+2.4%", icon: Calendar, color: "text-[#8B5CF6]", industry: "40%", data: [68, 70, 69, 71, 73, 72, parseFloat(stats.day1)] },
        { title: "Day 7 Retention", value: stats.day7, trend: "+1.2%", icon: CalendarDays, color: "text-[#06B6D4]", industry: "20%", data: [35, 36, 38, 37, 39, 38.5, parseFloat(stats.day7)] },
        { title: "Day 30 Retention", value: stats.day30, trend: "+0.8%", icon: Calendar, color: "text-[#F59E0B]", industry: "10%", data: [21, 20, 19, 20, 19, 18.5, parseFloat(stats.day30)] },
        { title: "Avg Session Time", value: stats.avgSession, trend: "+15s", icon: Clock, color: "text-[#10B981]", industry: "5m+", data: [3.5, 3.8, 4, 3.9, 4.1, 4.2] },
    ];

    return (
        <div className="font-body">

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="p-2 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6]"
                            >
                                <Repeat size={28} />
                            </motion.div>
                            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Retention <span className="cyber-gradient-text">Analysis</span></h1>
                        </div>
                        <p className="text-gray-400 mt-2">Analyze user retention patterns and cohort behavior over time</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mr-4">
                            <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow"></div>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest leading-none">Live</span>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all">
                            <Download size={18} />
                            EXPORT DATA
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="cyber-card p-4 flex flex-wrap items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                        <Calendar size={16} className="text-[#8B5CF6]" />
                        <span className="text-sm font-medium text-gray-300">Last 30 Days</span>
                        <ChevronDown size={14} className="text-gray-500" />
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                        <Users size={16} className="text-[#06B6D4]" />
                        <span className="text-sm font-medium text-gray-300">All Users</span>
                        <ChevronDown size={14} className="text-gray-500" />
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block"></div>

                    <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                        {['Daily', 'Weekly', 'Monthly'].map(type => (
                            <button
                                key={type}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'Monthly' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {kpis.map((kpi, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="cyber-card p-6 flex flex-col gap-4 group"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${kpi.color}`}>
                                    <kpi.icon size={24} />
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${kpi.trend.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {kpi.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {kpi.trend}
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm font-sans mb-1">{kpi.title}</p>
                                <h3 className="text-3xl font-mono font-bold text-white tracking-tight">{kpi.value}</h3>
                            </div>

                            <div className="h-10 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={kpi.data.map((v, i) => ({ val: v }))}>
                                        <Line type="monotone" dataKey="val" stroke={kpi.color.includes('purple') ? '#8B5CF6' : kpi.color.includes('blue') ? '#06B6D4' : kpi.color.includes('amber') ? '#F59E0B' : '#10B981'} strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider flex justify-between items-center">
                                <span>Industry Benchmark</span>
                                <span className="text-gray-300">{kpi.industry}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs and Content */}
                <div className="flex flex-col gap-6">
                    <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                        {[
                            { id: 'cohort', label: 'Cohort Analysis', icon: Users },
                            { id: 'curves', label: 'Retention Curves', icon: TrendingUp },
                            { id: 'segments', label: 'Segments', icon: PieChart },
                            { id: 'insights', label: 'Insights', icon: Lightbulb },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-[#8B5CF6] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-full">
                        <AnimatePresence mode="wait">
                            {activeTab === 'cohort' && <CohortTable key="cohort" cohorts={cohortData} />}
                            {activeTab === 'curves' && <RetentionCurves key="curves" cohorts={cohortData} />}
                            {activeTab === 'segments' && <SegmentedAnalysis key="segments" />}
                            {activeTab === 'insights' && <RetentionInsights key="insights" />}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

const CohortTable = ({ cohorts }) => {
    const displayCohorts = cohorts.length > 0 ? cohorts : [
        { name: "Oct 2024", size: "1,250", retention: [100, 72.4, 45.2, 38.9, 28.4, 21.2, 18.7, 15.4] },
    ];

    const getRetentionColor = (val) => {
        if (val >= 70) return "bg-[#10B981]/20 text-[#10B981]";
        if (val >= 50) return "bg-[#8B5CF6]/20 text-[#8B5CF6]";
        if (val >= 30) return "bg-[#F59E0B]/20 text-[#F59E0B]";
        if (val >= 20) return "bg-[#14B8A6]/20 text-[#14B8A6]";
        return "bg-[#EF4444]/20 text-[#EF4444]";
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="cyber-card overflow-hidden"
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/40 border-b border-white/5">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cohort</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Size</th>
                            {['Day 0', 'Day 1', 'Day 7', 'Day 14', 'Day 30', 'Day 60', 'Day 90'].map(day => (
                                <th key={day} className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {displayCohorts.map((cohort, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#8B5CF6]' : idx === 1 ? 'bg-[#06B6D4]' : idx === 2 ? 'bg-[#F472B6]' : 'bg-[#22C55E]'}`}></div>
                                        <span className="text-sm font-medium text-white">{cohort.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-sm font-mono text-gray-400">{cohort.size}</td>
                                {cohort.retention.slice(0, 7).map((val, i) => (
                                    <td key={i} className="px-6 py-5 text-center">
                                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono ${getRetentionColor(val)}`}>
                                            {val}%
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

const RetentionCurves = ({ cohorts }) => {
    const data = cohorts.length > 0 ? [0, 1, 7, 14, 30, 60, 90].map((day, dIdx) => {
        const row = { day };
        cohorts.slice(0, 3).forEach(c => {
            row[c.name.split(' ')[0]] = c.retention[dIdx];
        });
        return row;
    }) : [
        { day: 0, Oct: 100, Predict: 100 },
        { day: 1, Oct: 72.4, Predict: 70 },
        { day: 7, Oct: 45.2, Predict: 40 },
        { day: 14, Oct: 38.9, Predict: 32 },
        { day: 30, Oct: 28.4, Predict: 22 },
        { day: 60, Oct: 21.2, Predict: 15 },
        { day: 90, Oct: 18.7, Predict: 12 },
    ];

    const activeCohorts = cohorts.length > 0 ? cohorts.slice(0, 3) : [{ name: 'Oct 2024', color: '#8B5CF6' }];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card p-8 flex flex-col gap-6"
        >
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 px-3 py-1.5 rounded-full text-[#8B5CF6] text-xs font-bold">
                        <div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div>
                        Oct 2024
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-400 text-xs font-bold">
                        <div className="w-2 h-2 rounded-full bg-[#06B6D4]"></div>
                        Sep 2024
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-400 text-xs font-bold">
                        <div className="w-2 h-2 rounded-full bg-[#F472B6]"></div>
                        Aug 2024
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] text-xs font-bold">
                    <TrendingUp size={16} />
                    SHOW PREDICTION
                </button>
            </div>

            <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="day" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: 'rgba(18, 18, 20, 0.9)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="Oct" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
                        {cohorts.length > 1 && <Line type="monotone" dataKey={cohorts[1].name.split(' ')[0]} stroke="#06B6D4" strokeWidth={2} dot={{ r: 4, fill: '#06B6D4' }} />}
                        {cohorts.length > 2 && <Line type="monotone" dataKey={cohorts[2].name.split(' ')[0]} stroke="#F472B6" strokeWidth={2} dot={{ r: 4, fill: '#F472B6' }} />}
                        <Line type="monotone" dataKey="Predict" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

const SegmentedAnalysis = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
        {[
            { title: "Platform Breakdown", items: [{ name: "Web", val: "78%", users: "12,450" }, { name: "Mobile", val: "64%", users: "18,200" }, { name: "Desktop", val: "82%", users: "6,300" }], icon: Users },
            { title: "User Segments", items: [{ name: "New Users", val: "45%", users: "24,000" }, { name: "Power Users", val: "92%", users: "2,500" }, { name: "Returning", val: "58%", users: "15,800" }], icon: PieChart }
        ].map((seg, i) => (
            <div key={i} className="cyber-card p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <seg.icon size={20} className="text-[#8B5CF6]" />
                    <h3 className="text-white font-heading font-bold">{seg.title}</h3>
                </div>
                {seg.items.map((item, j) => (
                    <div key={j} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-bold">{item.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{item.users} users</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-mono font-bold text-[#8B5CF6]">{item.val}</span>
                            <div className="text-[10px] text-green-400 font-bold leading-none">+1.2%</div>
                        </div>
                    </div>
                ))}
            </div>
        ))}
    </motion.div>
);

const RetentionInsights = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
        {[
            { title: "Excellent Onboarding", icon: Lightbulb, color: "border-[#10B981]", desc: "Day 1 retention for users who complete the welcome quiz is 15% higher than average.", action: "Make welcome quiz a mandatory part of signup flow.", impact: "High" },
            { title: "Day 7 Drop-off", icon: TrendingUp, color: "border-[#F59E0B]", desc: "Most users drop off between Day 3 and Day 7 if no push notifications are received.", action: "Implement Day 5 engagement email for inactive users.", impact: "Medium" },
            { title: "Power User Behavior", icon: Users, color: "border-[#8B5CF6]", desc: "Top 5% of users spend 3x more time on the Dashboard than any other page.", action: "Feature Dashboard highlights in weekly newsletters.", impact: "Medium" }
        ].map((insight, i) => (
            <div key={i} className={`cyber-card p-6 border-l-4 ${insight.color} flex flex-col gap-4`}>
                <div className="flex items-center gap-3">
                    <insight.icon size={20} className="text-white" />
                    <h4 className="text-white font-bold">{insight.title}</h4>
                </div>
                <p className="text-sm text-gray-400">{insight.desc}</p>
                <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Recommended Action</span>
                    <p className="text-xs text-white leading-relaxed">{insight.action}</p>
                </div>
                <div className="text-right mt-auto">
                    <span className="text-[10px] text-gray-500 font-mono">EST. IMPACT: </span>
                    <span className="text-[10px] text-[#8B5CF6] font-bold font-mono uppercase">{insight.impact}</span>
                </div>
            </div>
        ))}
    </motion.div>
);

export default RetentionPage;
