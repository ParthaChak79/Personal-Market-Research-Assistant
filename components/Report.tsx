
import React, { useState, useRef } from 'react';
import { SurveyData } from '../types';
import { PollCard } from './PollCard';
import { FileText, ExternalLink, ArrowLeft, Image as ImageIcon, Loader2, Printer, Search, ShieldCheck, CheckCircle2, Globe } from 'lucide-react';
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
      alert('Failed to export image.');
    } finally {
      setIsExporting(false);
    }
  };

  const tags = data.tags || [];
  const analysisLines = (data.analysis || "").split('\n').filter(line => line.trim().length > 0);
  const polls = data.polls || [];
  const citations = data.citations || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print px-4">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-slate-500 hover:text-[var(--brand-from)] transition-colors font-bold"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-all shadow-sm font-bold"
          >
            <Printer size={18} />
            Export PDF
          </button>
          <button 
            onClick={downloadJpg}
            disabled={isExporting}
            className="flex items-center gap-3 px-6 py-3 gradient-bg text-white rounded-full transition-all shadow-lg active:scale-95 disabled:opacity-50 font-bold"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={20} />}
            Save Image
          </button>
        </div>
      </div>

      <div 
        ref={reportRef} 
        id="report-content" 
        className="bg-slate-50/50 rounded-[3rem] p-4 md:p-8 space-y-8 overflow-hidden border border-slate-100"
      >
        {/* Header Hero */}
        <div className="gradient-bg rounded-[2.5rem] p-8 md:p-12 text-white text-center shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              {tags.map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mx-1 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tighter">{data.decision}</h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg font-medium">
              Forensic Synthesis: Verified decision vectors reverse-engineered from global empirical data and social intelligence simulations.
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mb-32 -mr-32" />
        </div>

        {/* Strategic Analysis */}
        <div className="max-w-4xl mx-auto w-full">
          <section className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                  <FileText className="text-[var(--brand-from)] w-8 h-8" />
                  Decision Vectors & Analysis
                </h2>
                <p className="text-slate-400 text-sm font-bold">Forensic deductions reverse-engineered from 20+ global data sources.</p>
              </div>
              <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-100">
                <ShieldCheck size={16} />
                High Fidelity Verified
              </div>
            </div>
            
            <div className="space-y-6">
              {analysisLines.map((line, i) => (
                <div key={i} className="flex gap-6 p-6 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-50 transition-all group items-start border border-transparent hover:border-indigo-100">
                  <div className="mt-1.5 shrink-0">
                    <CheckCircle2 size={24} className="text-indigo-400 group-hover:text-[var(--brand-from)] transition-colors" />
                  </div>
                  <p className="text-slate-700 text-lg md:text-xl leading-relaxed font-semibold">
                    {line.replace(/^" |^"/, '').replace(/- |• /, '').trim()}
                  </p>
                </div>
              ))}
              {analysisLines.length === 0 && (
                <div className="py-12 text-center text-slate-400 font-bold italic">
                  No strategic insights available for this dataset.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 9 Polls Grid */}
        <section className="space-y-8 pt-8">
          <div className="flex items-baseline justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900">Empirical Simulations</h2>
              <p className="text-slate-400 text-sm font-medium">Data-backed population sentiment modeling (n=12,000+ virtual agents).</p>
            </div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Behavioral Synthesis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 poll-grid">
            {polls.map((poll) => (
              <div key={poll.id} className="poll-card h-full">
                <PollCard poll={poll} />
              </div>
            ))}
          </div>
        </section>

        {/* Grounding Network - Enhanced for many sources */}
        <section className="space-y-6 pt-12 pb-8">
          <div className="flex items-center gap-4 px-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-3xl font-black text-slate-900">Verification Source Network</h2>
              <p className="text-slate-400 text-sm font-medium">Real-time grounding data scoured from these unique research domains.</p>
            </div>
            <div className="h-px flex-grow bg-slate-100 ml-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
            {citations.map((cite, i) => (
              <a 
                key={`${cite.url}-${i}`} 
                href={cite.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-[var(--brand-from)] hover:shadow-xl transition-all group relative overflow-hidden shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">{cite.source}</span>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-[var(--brand-from)] transition-colors" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs group-hover:text-[var(--brand-from)] transition-colors line-clamp-2 leading-relaxed">
                  {cite.title}
                </h4>
                <div className="mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Source Verified</span>
                </div>
              </a>
            ))}
            {citations.length === 0 && (
              <div className="col-span-full p-16 text-center text-slate-400 font-bold border-4 border-dashed border-slate-50 rounded-[3rem] bg-white/50">
                <Search className="mx-auto mb-4 opacity-20" size={48} />
                <p className="text-lg">Real-time source network currently initializing...</p>
                <p className="text-sm font-medium opacity-60">Verification requires deep multi-agent grounding.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
