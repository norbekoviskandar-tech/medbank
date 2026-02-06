"use client";
import React from 'react';
import { Clock, Smartphone, AlertTriangle } from 'lucide-react';

const QuickInsights = ({ insights = [] }) => {
    if (insights.length === 0) return null;

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
