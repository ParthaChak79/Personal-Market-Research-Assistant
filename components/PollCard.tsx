
import React from 'react';
import { PollQuestion } from '../types';

interface PollCardProps {
  poll: PollQuestion;
}

const COLORS = ['#1e293b', '#6366f1', '#a855f7', '#ec4899', '#10b981'];

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
  const bgClass = poll.bgColor || BG_VARIANTS[0];
  
  // Sort options by percentage for better scannability
  const sortedOptions = [...poll.options].sort((a, b) => b.percentage - a.percentage);
  const maxPct = sortedOptions.length > 0 ? sortedOptions[0].percentage : 0;

  return (
    <div className={`p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col group ${bgClass}`}>
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-6 bg-[var(--brand-from)] rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
           <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight line-clamp-4">
            {poll.question}
          </h3>
        </div>
      </div>
      
      <div className="flex-grow space-y-6 mb-10 relative">
        {/* Subtle background grid */}
        <div className="absolute inset-0 flex justify-between pointer-events-none px-1 py-1">
          <div className="w-px h-full border-l border-slate-200/50" />
          <div className="w-px h-full border-l border-slate-200/50" />
          <div className="w-px h-full border-l border-slate-200/50" />
        </div>

        {sortedOptions.map((option, idx) => {
          const isWinner = option.percentage === maxPct && maxPct > 0;
          
          return (
            <div key={idx} className="relative z-10 space-y-2 group/option">
              <div className="flex justify-between items-start gap-4 px-1">
                <div className="flex items-center gap-2 max-w-[80%]">
                  {isWinner && (
                    <span className="shrink-0 text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded-sm tracking-tighter uppercase">
                      Most Probable
                    </span>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-widest leading-normal ${isWinner ? 'text-slate-900' : 'text-slate-500'}`}>
                    {option.label}
                  </span>
                </div>
                <span className={`text-xs font-black shrink-0 ${isWinner ? 'text-indigo-600' : 'text-slate-900'}`}>
                  {option.percentage}%
                </span>
              </div>
              
              <div className="h-4 w-full bg-slate-200/30 rounded-full overflow-hidden border border-white/50">
                <div 
                  className="h-full transition-all duration-1000 ease-out relative"
                  style={{ 
                    width: `${option.percentage}%`, 
                    backgroundColor: isWinner ? 'var(--brand-from)' : COLORS[idx % COLORS.length],
                    opacity: isWinner ? 1 : 0.6
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                </div>
              </div>
            </div>
          );
        })}

        {/* X-Axis Labels */}
        <div className="flex justify-between px-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        {sortedOptions.length === 0 && (
          <div className="flex items-center justify-center h-40 text-slate-400 font-bold italic text-sm text-center">
            Dataset synthesizing...
          </div>
        )}
      </div>

      <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl mt-auto border border-white/60 shadow-inner group-hover:bg-white/95 transition-all">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-900 opacity-20" />)}
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Contextual Reasoning</span>
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed font-semibold italic line-clamp-4">
          {poll.context}
        </p>
      </div>
    </div>
  );
};
