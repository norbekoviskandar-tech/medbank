"use client";
import React from 'react';
import { Clock, Smartphone, AlertTriangle } from 'lucide-react';

const QuickInsights = () => {
    const insights = [
        { label: "Peak hours: 2-4 PM", icon: Clock, color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
        { label: "Mobile users: 72%", icon: Smartphone, color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10" },
        { label: "Bounce rate increased", icon: AlertTriangle, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" }
    ];

    return (
        <div className="flex flex-wrap gap-4 items-center">
            {insights.map((insight, idx) => (
                <div
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full ${insight.bg} border border-${insight.color.replace('text-', '')}/20 transition-all hover:scale-105 cursor-pointer`}
                >
                    <insight.icon className={insight.color} size={16} />
                    <span className={`text-xs font-medium ${insight.color}`}>{insight.label}</span>
                </div>
            ))}
        </div>
    );
};

export default QuickInsights;
