"use client";
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DashboardCharts = ({ engagementData, sessionData }) => {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
            {/* Engagement Chart */}
            <div className="bg-card border border-border p-6 h-[400px] flex flex-col rounded-3xl shadow-sm">
                <h3 className="text-foreground font-heading font-bold mb-6">User Engagement Over Time</h3>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={engagementData}>
                            <defs>
                                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0066CC" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--cyber-gray)" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--cyber-gray)" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                                itemStyle={{ color: '#005EB8', fontWeight: 'bold' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke="#0066CC"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorEngagement)"
                                dot={{ fill: '#0066CC', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Session Chart */}
            <div className="bg-card border border-border p-6 h-[400px] flex flex-col rounded-3xl shadow-sm">
                <h3 className="text-foreground font-heading font-bold mb-6">Question Distribution by System</h3>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sessionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--cyber-gray)" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--cyber-gray)" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                                itemStyle={{ color: '#0D9488', fontWeight: 'bold' }}
                            />
                            <Bar
                                dataKey="val"
                                fill="#0891B2"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                                activeBar={{ fill: '#0066CC', strokeWidth: 0 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
