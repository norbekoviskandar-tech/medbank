"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Zap, Clock, BarChart3, TrendingUp, TrendingDown,
    Download, RefreshCw, ChevronDown, MousePointer2, Smartphone, Monitor
} from 'lucide-react';
import {
    BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
    CartesianGrid, PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import { getEngagementStats, getDashboardStats } from '@/services/analytics.service';

const EngagementPage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [engagementData, setEngagementData] = useState({ distribution: [], recentSessions: [] });
    const [stats, setStats] = useState({ active: "0", duration: "0s" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsRefreshing(true);
        try {
            const data = await getEngagementStats();
            const dashStats = await getDashboardStats();
            setEngagementData(data);
            setStats({
                active: dashStats.dau.toLocaleString(),
                duration: dashStats.avgSession
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
        { title: "Active Users", value: stats.active, trend: "+12.5%", icon: Users, color: "text-[#8B5CF6]", period: "Last 24 hours" },
        { title: "Avg Session Duration", value: stats.duration, trend: "+8.2%", icon: Clock, color: "text-[#06B6D4]", period: "Per user" },
        { title: "Events Per Session", value: "18.7", trend: "+5.4%", icon: Zap, color: "text-[#14B8A6]", period: "Average" },
        { title: "Bounce Rate", value: "32.1%", trend: "-2.3%", icon: TrendingDown, color: "text-[#F59E0B]", period: "All pages", improvement: true },
    ];

    return (
        <div className="font-body">

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ rotate: 15 }}
                                className="p-2 rounded-xl bg-[#06B6D4]/20 text-[#06B6D4]"
                            >
                                <Users size={28} />
                            </motion.div>
                            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Engagement <span className="cyber-gradient-text">Analytics</span></h1>
                        </div>
                        <p className="text-gray-400 mt-2">Monitor user behavior and interaction patterns in real-time</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mr-4">
                            <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow"></div>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest leading-none">Aggregating Live</span>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891b2] text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all">
                            <Download size={18} />
                            EXPORT ANALYTICS
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit mb-8 overflow-x-auto no-scrollbar max-w-full">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'events', label: 'Events', icon: Zap },
                        { id: 'sessions', label: 'Sessions', icon: Clock },
                        { id: 'users', label: 'Users', icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#8B5CF6] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Metrics Strip */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {metrics.map((metric, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="cyber-card p-5 group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${metric.color}`}>
                                    <metric.icon size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{metric.title}</span>
                                    <span className="text-2xl font-mono font-bold text-white tracking-tight">{metric.value}</span>
                                    <span className="text-gray-600 text-[10px] font-mono">{metric.period}</span>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-[10px] font-bold border border-current border-opacity-20 ${metric.improvement || metric.trend.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {metric.trend}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Charts */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        {/* Session Duration Distribution */}
                        <div className="cyber-card p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-white font-heading font-bold text-lg">Session Duration Distribution</h3>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
                                    <div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div>
                                    Number of Sessions
                                </div>
                            </div>
                            <div className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={engagementData?.distribution?.length > 0 ? engagementData.distribution : [
                                        { name: '0-30s', val: 1240 },
                                        { name: '30s-1m', val: 2180 },
                                        { name: '1-2m', val: 1650 },
                                        { name: '2-5m', val: 980 },
                                        { name: '5-10m', val: 420 },
                                        { name: '10-30m', val: 180 },
                                        { name: '30m+', val: 60 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                        <RechartsTooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: 'rgba(18, 18, 20, 0.9)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', color: '#fff' }}
                                        />
                                        <Bar dataKey="val" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
                                {[
                                    { label: "Avg Duration", val: "2m 18s" },
                                    { label: "Median", val: "1m 45s" },
                                    { label: "Peak Time", val: "30s-1m" },
                                    { label: "Total Sessions", val: "6,710" },
                                ].map((s, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{s.label}</div>
                                        <div className="text-sm font-mono font-bold text-white">{s.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Event Heatmap - Simplified */}
                        <div className="cyber-card p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-heading font-bold text-lg">Event Heatmap (24h)</h3>
                                <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                                    <span>Lighter</span>
                                    <div className="flex gap-1 h-3 w-16 px-1 rounded bg-black/40 border border-white/5">
                                        <div className="flex-1 bg-[#8B5CF6]/20 rounded-sm"></div>
                                        <div className="flex-1 bg-[#8B5CF6]/50 rounded-sm"></div>
                                        <div className="flex-1 bg-[#8B5CF6] rounded-sm"></div>
                                    </div>
                                    <span>Pulsing Peak</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 md:grid-cols-24 gap-1 h-32">
                                {Array.from({ length: 24 * 7 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-sm transition-all hover:scale-125 cursor-help ${Math.random() > 0.8 ? 'bg-[#8B5CF6]' :
                                            Math.random() > 0.5 ? 'bg-[#8B5CF6]/50' :
                                                'bg-[#8B5CF6]/10'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono">
                                <span>12 AM</span>
                                <span>6 AM</span>
                                <span>12 PM</span>
                                <span>6 PM</span>
                                <span>11 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Segments & Details */}
                    <div className="flex flex-col gap-8">
                        {/* Behavioral Segments */}
                        <div className="cyber-card p-8 min-h-[400px]">
                            <h3 className="text-white font-heading font-bold text-lg mb-6">User Segments</h3>
                            <div className="h-48 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={[
                                                { name: 'Power Users', value: 12 },
                                                { name: 'Regular Users', value: 35 },
                                                { name: 'Occasional', value: 38 },
                                                { name: 'At-Risk', value: 15 },
                                            ]}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {[0, 1, 2, 3].map((_, i) => <Cell key={i} fill={['#10B981', '#8B5CF6', '#06B6D4', '#F59E0B'][i]} />)}
                                        </Pie>
                                    </RePieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-mono font-bold text-white">4.2k</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Active</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 mt-4">
                                {[
                                    { name: 'Power Users', val: '12%', color: 'bg-[#10B981]' },
                                    { name: 'Regular Users', val: '35%', color: 'bg-[#8B5CF6]' },
                                    { name: 'Occasional', val: '38%', color: 'bg-[#06B6D4]' },
                                    { name: 'At-Risk Users', val: '15%', color: 'bg-[#F59E0B]' },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                                            <span className="text-xs font-bold text-gray-300">{s.name}</span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-white">{s.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity Mini Table */}
                        <div className="cyber-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-heading font-bold">Session Activity</h3>
                                <button className="text-[10px] font-bold text-[#8B5CF6] uppercase hover:underline">View All</button>
                            </div>
                            <div className="flex flex-col gap-4">
                                {(engagementData?.recentSessions?.length > 0 ? engagementData.recentSessions : [
                                    {id: '#U-102', time: '14m ago', events: 4, deviceType: 'Smartphone'},
                                ]).map((s, i) => {
                                    const DeviceIcon = s.device === 'Smartphone' || s.deviceType === 'Smartphone' ? Smartphone : Monitor;
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-black/40 text-gray-400 group-hover:text-white transition-colors">
                                                    <DeviceIcon size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-mono font-bold text-white">{s.id}</span>
                                                    <span className="text-[10px] text-gray-500">{s.time}</span>
                                                </div>
                                            </div>
                                        <div className="text-right">
                                            <div className="text-xs font-mono font-bold text-[#10B981]">{s.events} ev</div>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Session Data Table */}
                <div className="mt-8">
                    <div className="cyber-card overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="text-white font-heading font-bold text-lg">Detailed Session Log</h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search User ID..."
                                    className="flex-grow md:w-64 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-[#8B5CF6] outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 border-b border-white/5">
                                    <tr>
                                        {['User ID', 'Start Time', 'Duration', 'Events', 'Platform', 'Status'].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {[
                                        { user: "MB-88210", start: "14:22", dur: "12m 45s", ev: 42, device: "WEB", status: "ACTIVE" },
                                        { user: "MB-77412", start: "14:18", dur: "4m 12s", ev: 18, device: "MOBILE", status: "COMPLETED" },
                                        { user: "MB-10293", start: "14:15", dur: "0m 32s", ev: 3, device: "WEB", status: "BOUNCED" },
                                        { user: "MB-55612", start: "14:10", dur: "15m 01s", ev: 65, device: "DESKTOP", status: "ACTIVE" },
                                        { user: "MB-99201", start: "14:05", dur: "2m 55s", ev: 12, device: "WEB", status: "COMPLETED" },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-white">{row.user}</td>
                                            <td className="px-6 py-4 text-xs text-gray-400">{row.start}</td>
                                            <td className="px-6 py-4 text-xs font-mono text-white">{row.dur}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-[#8B5CF6]">{row.ev}</td>
                                            <td className="px-6 py-4 text-xs text-gray-400">{row.device}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${row.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                                                    row.status === 'BOUNCED' ? 'bg-red-500/10 text-red-100' : 'bg-gray-500/10 text-gray-500'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EngagementPage;
