"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Target, CheckCircle, Clock, DollarSign,
    Download, RefreshCw, ChevronDown, Filter, LayoutGrid, BarChart3, TrendingDown,
    ArrowRight, Users, Smartphone, Globe, CreditCard
} from 'lucide-react';
import {
    BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
    CartesianGrid, Cell
} from 'recharts';

import { getFunnelMetrics, getDashboardStats } from '@/services/analytics.service';

const FunnelPage = () => {
    const [viewMode, setViewMode] = useState('funnel');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [funnelSteps, setFunnelSteps] = useState([]);
    const [stats, setStats] = useState({ conversion: "0%", count: "0" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsRefreshing(true);
        try {
            const data = await getFunnelMetrics();
            const dashStats = await getDashboardStats();
            setFunnelSteps(data);
            setStats({
                conversion: `${dashStats.conversion}%`,
                count: dashStats.totalTests.toLocaleString()
            });
        } catch (err) {
            console.error(err);
        }
        setIsRefreshing(false);
    };

    const handleRefresh = () => {
        loadData();
    };

    const metrics = [
        { title: "Overall Conversion", value: stats.conversion, trend: "+2.3%", icon: Target, color: "text-[#8B5CF6]", benchmark: "Industry avg: 12%" },
        { title: "Total Conversions", value: stats.count, trend: "+156", icon: CheckCircle, color: "text-[#10B981]", benchmark: "Last 30 days" },
        { title: "Avg Time to Convert", value: "3.2 days", trend: "-0.4 days", icon: Clock, color: "text-[#06B6D4]", benchmark: "Target: <4 days", positive: true },
        { title: "Revenue Impact", value: "$134K", trend: "+$12K", icon: DollarSign, color: "text-[#F59E0B]", benchmark: "$19.94 avg" },
    ];

    const displaySteps = funnelSteps.length > 0 ? funnelSteps : [
        { name: "Landing Page Views", users: 45280, conv: 100, drop: 0, color: "#8B5CF6", lost: 0 },
        { name: "Product Page Views", users: 32150, conv: 71.0, drop: 29.0, color: "#60A5FA", lost: 13130 },
        { name: "Add to Cart", users: 18420, conv: 40.7, drop: 18.2, color: "#F472B6", lost: 13730 },
        { name: "Checkout Started", users: 12680, conv: 28.0, drop: 12.7, color: "#22C55E", lost: 5740 },
        { name: "Payment Info", users: 8940, conv: 19.7, drop: 8.3, color: "#F59E0B", lost: 3740 },
        { name: "Purchase Complete", users: 6720, conv: 14.8, drop: 4.9, color: "#EF4444", lost: 2220 },
    ];

    return (
        <div className="font-body">

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                className="p-2 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6]"
                            >
                                <TrendingUp size={28} />
                            </motion.div>
                            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Funnel <span className="cyber-gradient-text">Analysis</span></h1>
                        </div>
                        <p className="text-gray-400 mt-2">Track conversion paths and identify optimization opportunities</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all">
                            <Download size={18} />
                            EXPORT REPORT
                        </button>
                    </div>
                </div>

                {/* Funnel Controls */}
                <div className="cyber-card p-4 flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-gray-300 cursor-pointer hover:border-[#8B5CF6]/50 transition-all">
                            <Filter size={16} className="text-[#8B5CF6]" />
                            <span className="text-sm font-bold">E-commerce Checkout</span>
                            <ChevronDown size={14} />
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-gray-300 cursor-pointer hover:border-[#06B6D4]/50 transition-all">
                            <Clock size={16} className="text-[#06B6D4]" />
                            <span className="text-sm font-bold">Last 30 Days</span>
                            <ChevronDown size={14} />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setViewMode('funnel')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'funnel' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <LayoutGrid size={14} />
                            FUNNEL VIEW
                        </button>
                        <button
                            onClick={() => setViewMode('bar')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'bar' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <BarChart3 size={14} />
                            BAR CHART
                        </button>
                    </div>
                </div>

                {/* Conversion Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {metrics.map((m, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="cyber-card p-6 flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${m.color}`}>
                                    <m.icon size={24} />
                                </div>
                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${m.trend.startsWith('+') || m.positive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {m.trend}
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm font-sans mb-1">{m.title}</p>
                                <h3 className="text-3xl font-mono font-bold text-white tracking-tight">{m.value}</h3>
                                <p className="text-[10px] text-gray-600 font-mono mt-1 uppercase tracking-wider">{m.benchmark}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Funnel Visualization */}
                    <div className="xl:col-span-3 flex flex-col gap-6">
                        <div className="cyber-card p-8">
                            <h3 className="text-white font-heading font-bold text-xl mb-10">Conversion Funnel Visualizer</h3>

                            <div className="flex flex-col gap-0">
                                {displaySteps.map((step, idx) => (
                                    <React.Fragment key={idx}>
                                        <motion.div
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.15 }}
                                            className="relative flex items-center group cursor-pointer"
                                            style={{ height: '64px', marginBottom: idx === funnelSteps.length - 1 ? 0 : '12px' }}
                                        >
                                            <div
                                                className="absolute inset-0 rounded-r-2xl border-l-[6px] transition-all group-hover:brightness-125"
                                                style={{
                                                    width: `${step.conv}%`,
                                                    backgroundColor: `${step.color}15`,
                                                    borderColor: step.color,
                                                    boxShadow: `inset 10px 0 30px ${step.color}10`
                                                }}
                                            ></div>

                                            <div className="relative flex items-center justify-between w-full px-8 z-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-white">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-sm tracking-wide">{step.name}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono uppercase">Step {idx + 1}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-12">
                                                    <div className="text-right">
                                                        <div className="text-xl font-mono font-bold text-white">{step.users.toLocaleString()}</div>
                                                        <div className="text-[10px] text-gray-500 font-bold">USERS</div>
                                                    </div>
                                                    <div className="text-right w-16">
                                                        <div className="text-xl font-mono font-bold" style={{ color: step.color }}>{step.conv}%</div>
                                                        <div className="text-[10px] text-gray-500 font-bold">CONV.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {idx < funnelSteps.length - 1 && (
                                            <div className="flex justify-center -my-2 relative z-20">
                                                <div className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 shadow-lg backdrop-blur-md">
                                                    <TrendingDown size={12} className="text-red-400" />
                                                    <span className="text-[10px] font-mono font-bold text-red-400">{step.lost.toLocaleString()} LOST ({Math.round(step.drop)}%)</span>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "By Device Type", icon: Smartphone, headers: ["Device", "Users", "Conversion"], rows: [{ n: "Desktop", u: "42k", c: "18.2%" }, { n: "Mobile", u: "28k", c: "12.4%" }, { n: "Tablet", u: "5k", c: "8.5%" }] },
                                { title: "By Traffic Source", icon: Globe, headers: ["Source", "Users", "Conversion"], rows: [{ n: "Direct", u: "15k", c: "21.0%" }, { n: "Organic", u: "32k", c: "14.5%" }, { n: "Paid Ads", u: "12k", c: "9.2%" }] }
                            ].map((table, i) => (
                                <div key={i} className="cyber-card p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <table.icon size={20} className="text-[#8B5CF6]" />
                                        <h4 className="text-white font-bold">{table.title}</h4>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                            <tr>
                                                <th className="pb-4">{table.headers[0]}</th>
                                                <th className="pb-4">{table.headers[1]}</th>
                                                <th className="pb-4 text-right">{table.headers[2]}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {table.rows.map((row, j) => (
                                                <tr key={j}>
                                                    <td className="py-3 text-sm text-gray-300">{row.n}</td>
                                                    <td className="py-3 text-sm font-mono text-white">{row.u}</td>
                                                    <td className="py-3 text-sm font-mono font-bold text-[#8B5CF6] text-right">{row.c}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="cyber-card p-6 border-l-4 border-[#EF4444]">
                            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                                <TrendingDown size={18} className="text-red-400" />
                                Top Drop-off Point
                            </h4>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-4">
                                <div className="text-sm text-gray-300 mb-1">Product Page → Add to Cart</div>
                                <div className="text-2xl font-mono font-bold text-red-400">59.3% LOSS</div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Most users bounce before adding items to their cart. This suggests friction in product selection or pricing clarity.
                            </p>
                        </div>

                        <div className="cyber-card p-6 border-l-4 border-[#10B981]">
                            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                                <TrendingUp size={18} className="text-green-400" />
                                Growth Opportunities
                            </h4>
                            <div className="flex flex-col gap-4">
                                {[{ t: "Fast Checkout", d: "Users who use Apple Pay/Google Pay convert 42% faster.", i: CreditCard }, { t: "New Traffic", d: "Organic search leads have the highest retention.", i: Users }].map((opt, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="mt-1">
                                            <opt.i size={16} className="text-[#10B981]" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">{opt.t}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">{opt.d}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="cyber-card p-6 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent">
                            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                                <ArrowRight size={18} className="text-[#8B5CF6]" />
                                A/B Test Results
                            </h4>
                            <div className="space-y-4">
                                <div className="relative pl-4 border-l border-white/10 text-xs text-gray-400">
                                    <div className="absolute top-0 left-[-4px] w-2 h-2 rounded-full bg-[#8B5CF6]"></div>
                                    <span className="text-white font-bold">Variation B (Sticky)</span>
                                    <p className="mt-1">+8.4% improvement in "Add to Cart".</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FunnelPage;
