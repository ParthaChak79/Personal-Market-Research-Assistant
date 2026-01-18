import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { PollQuestion } from '../types';

interface PollCardProps {
  poll: PollQuestion;
}

const COLORS = ['#1e293b', '#6366f1', '#a855f7', '#ec4899'];

// Predefined professional soft backgrounds
const BG_VARIANTS = [
  'bg-slate-50 border-slate-200',
  'bg-blue-50/50 border-blue-100',
  'bg-indigo-50/50 border-indigo-100',
  'bg-purple-50/50 border-purple-100',
  'bg-emerald-50/50 border-emerald-100',
  'bg-rose-50/50 border-rose-100',
  'bg-amber-50/50 border-amber-100',
  'bg-cyan-50/50 border-cyan-100'
];

export const PollCard: React.FC<PollCardProps> = ({ poll }) => {
  // Use persistent random bg if provided, otherwise fallback
  const bgClass = poll.bgColor || BG_VARIANTS[0];

  return (
    <div className={`p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all h-full flex flex-col ${bgClass}`}>
      <h3 className="text-xl font-bold text-slate-800 mb-6 min-h-[4rem] leading-tight">
        {poll.question}
      </h3>
      
      <div className="h-72 mb-6 flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            layout="vertical" 
            data={poll.options} 
            margin={{ left: -10, right: 40, top: 0, bottom: 0 }}
          >
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={140} 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              interval={0}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xl border border-white/10">
                      {payload[0].value}% Sentiment
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="percentage" 
              radius={[0, 8, 8, 0]} 
              barSize={24}
              isAnimationActive={false}
            >
              {poll.options.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl mt-auto border border-white/40 shadow-inner">
        <p className="text-xs text-slate-700 leading-relaxed italic">
          <span className="font-black text-slate-900 not-italic uppercase text-[9px] tracking-widest block mb-2 opacity-50">Simulation Logic & Context</span>
          "{poll.context}"
        </p>
      </div>
    </div>
  );
};