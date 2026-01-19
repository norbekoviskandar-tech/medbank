"use client";
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DashboardCharts = ({ engagementData, sessionData }) => {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
            {/* Engagement Chart */}
            <div className="cyber-card p-6 h-[400px] flex flex-col">
                <h3 className="text-white font-heading font-medium mb-6">User Engagement Over Time</h3>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={engagementData}>
                            <defs>
                                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(18, 18, 20, 0.9)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#8B5CF6' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke="#8B5CF6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorEngagement)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Session Chart */}
            <div className="cyber-card p-6 h-[400px] flex flex-col">
                <h3 className="text-white font-heading font-medium mb-6">Session Duration Distribution</h3>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sessionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: 'rgba(18, 18, 20, 0.9)', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#14B8A6' }}
                            />
                            <Bar
                                dataKey="val"
                                fill="#14B8A6"
                                radius={[8, 8, 0, 0]}
                                barSize={60}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
