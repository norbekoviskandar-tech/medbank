"use client";
import React from 'react';
import { ChevronUp, ChevronDown, Monitor, Clock } from 'lucide-react';

const TopEvents = ({ events = [] }) => {
    return (
        <div className="cyber-card p-6 flex flex-col gap-4">
            <h3 className="text-white font-heading font-medium">Top Events This Week</h3>
            <div className="flex flex-col gap-3">
                {(events.length > 0 ? events : [
                    { name: "Page View", count: "45,678", trend: "up", change: "12%" },
                    { name: "Button Click", count: "12,345", trend: "up", change: "5%" },
                    { name: "Form Submit", count: "3,456", trend: "down", change: "2%" },
                ]).map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 group-hover:bg-[#8B5CF6]/20 group-hover:text-[#8B5CF6] transition-all">
                                <Monitor size={16} />
                            </div>
                            <span className="text-white text-sm font-medium">{event.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-white font-mono font-bold text-sm">{event.count}</span>
                            <div className={`flex items-center text-[10px] font-bold ${event.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                {event.trend === 'up' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {event.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActivityFeed = ({ activities = [] }) => {
    return (
        <div className="cyber-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-white font-heading font-medium">Real-time Activity</h3>
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow"></div>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {(activities.length > 0 ? activities : [
                    { action: "Signed Up", user: "user_4921", time: "2m ago", status: "success" },
                    { action: "Completed Test", user: "user_1023", time: "5m ago", status: "info" },
                ]).map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                <Clock size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white text-sm font-medium">{activity.action}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{activity.user}</span>
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">{activity.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BottomStats = ({ topEvents, recentActivities }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6 mb-12">
            <TopEvents events={topEvents} />
            <ActivityFeed activities={recentActivities} />
        </div>
    );
};

export default BottomStats;
