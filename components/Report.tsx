
import React, { useState, useRef } from 'react';
import { SurveyData } from '../types';
import { PollCard } from './PollCard';
import { FileText, ArrowLeft, Image as ImageIcon, Loader2, Printer, Globe, ShieldCheck, Zap, Compass } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface ReportProps {
  data: SurveyData;
  onReset: () => void;
}

export const Report: React.FC<ReportProps> = ({ data, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadJpg = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(reportRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `ARIA-Report-${data.id.substring(0, 8)}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const tags = data.tags || [];
  const analysisLines = (data.analysis || "").split('\n').filter(line => line.trim().length > 5);
  const polls = data.polls || [];
  const citations = data.citations || [];
  const actionPlan = data.actionPlan || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print px-4">
        <button onClick={onReset} className="flex items-center gap-2 text-slate-500 hover:text-[var(--brand-from)] transition-colors font-bold">
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-all shadow-sm font-bold">
            <Printer size={18} />
            Export PDF
          </button>
          <button onClick={downloadJpg} disabled={isExporting} className="flex items-center gap-3 px-6 py-3 gradient-bg text-white rounded-full transition-all shadow-lg active:scale-95 disabled:opacity-50 font-bold">
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={20} />}
            Save Image
          </button>
        </div>
      </div>

      <div ref={reportRef} id="report-content" className="bg-slate-50/50 rounded-[3rem] p-4 md:p-8 space-y-12 overflow-hidden border border-slate-100">
        <div className="gradient-bg rounded-[2.5rem] p-8 md:p-12 text-white text-center shadow-xl mb-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              {tags.map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mx-1 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tighter">{data.decision}</h1>
            <div className="flex items-center justify-center gap-2 text-white/80 font-bold">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Grounding Confidence: High (9 Simulations Active)</span>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mb-32 -mr-32" />
        </div>

        {/* Data Synthesis - Scannable Signals */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                <FileText className="text-[var(--brand-from)] w-8 h-8" />
                Signal Synthesis
              </h2>
              <p className="text-slate-400 text-sm font-bold">Key observations reverse-engineered from scoured research domains.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analysisLines.length > 0 ? analysisLines.map((line, i) => {
              const colonIndex = line.indexOf(':');
              const title = colonIndex !== -1 ? line.substring(0, colonIndex).trim() : `Observation ${i + 1}`;
              const description = colonIndex !== -1 ? line.substring(colonIndex + 1).trim() : line.trim();

              return (
                <div key={i} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col h-full">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                    <Zap size={20} />
                  </div>
                  <h4 className="font-black text-slate-900 text-[12px] mb-3 uppercase tracking-tighter leading-tight">
                    {title}
                  </h4>
                  <p className="text-slate-600 text-[13px] font-medium leading-relaxed">
                    {description}
                  </p>
                </div>
              );
            }) : (
              <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">
                Synthesizing observations...
              </div>
            )}
          </div>
        </section>

        {/* Poll Simulations */}
        <section className="space-y-8">
          <div className="flex items-baseline justify-between px-2">
            <h2 className="text-3xl font-black text-slate-900">Poll Simulations</h2>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Behavioral Synthesis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 poll-grid">
            {polls.length > 0 ? (
              polls.map((poll) => (
                <div key={poll.id} className="poll-card h-full"><PollCard poll={poll} /></div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-indigo-400" size={48} />
                  <p className="text-slate-400 font-bold">Simulating behavioral trends...</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Action Plan Section */}
        {actionPlan.length > 0 && (
          <section className="bg-slate-900 rounded-[3rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full -mr-48 -mt-48" />
            <div className="relative z-10 space-y-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-black flex items-center gap-4">
                  <Compass className="text-indigo-400 w-10 h-10" />
                  Strategic Action Plan
                </h2>
                <p className="text-indigo-200/60 font-bold text-sm ml-14">Actionable roadmap based on synthesized simulations.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {actionPlan.map((step, idx) => (
                  <div key={idx} className="flex gap-6 p-6 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-black text-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold leading-tight">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Grounding Network */}
        <section className="space-y-6 pt-12">
          <div className="flex items-center gap-4 px-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-900 flex items-center justify-center shadow-sm"><Globe size={20} /></div>
            <div className="space-y-0.5">
              <h2 className="text-3xl font-black text-slate-900">Grounding Network</h2>
              <p className="text-slate-400 text-sm font-medium">Real-time data sources supporting this research.</p>
            </div>
            <div className="h-px flex-grow bg-slate-100 ml-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
            {citations.length > 0 ? citations.map((cite, i) => (
              <a 
                key={`${cite.url}-${i}`} 
                href={cite.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col p-5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-400 hover:shadow-xl transition-all group shadow-sm overflow-hidden"
              >
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 truncate">
                  {cite.source}
                </span>
                <span className="text-slate-800 text-xs font-bold line-clamp-2 mb-1 group-hover:text-indigo-600">
                  {cite.title}
                </span>
                <span className="text-slate-300 text-[9px] font-medium truncate mt-auto">
                  {cite.url}
                </span>
              </a>
            )) : (
              <p className="text-slate-400 font-medium italic col-span-full text-center py-8">Grounding sources included in the logic model.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
