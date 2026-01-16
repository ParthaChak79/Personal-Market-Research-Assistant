import React, { useState, useRef } from 'react';
import { SurveyData } from '../types';
import { PollCard } from './PollCard';
import { FileText, ExternalLink, ArrowLeft, Send, Sparkles, Image as ImageIcon, Loader2, Printer } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface ReportProps {
  data: SurveyData;
  onFollowUp: (query: string) => void;
  onReset: () => void;
}

export const Report: React.FC<ReportProps> = ({ data, onFollowUp, onReset }) => {
  const [followUpQuery, setFollowUpQuery] = useState('');
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
        style: {
            borderRadius: '0',
        }
      });
      
      const link = document.createElement('a');
      link.download = `ARIA-Infographic-${data.decision.substring(0, 20).replace(/\s+/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
      alert('Failed to export. Screen size might be too large for browser memory. Try printing to PDF instead.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (followUpQuery.trim()) {
      onFollowUp(followUpQuery);
      setFollowUpQuery('');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-all shadow-sm font-bold"
          >
            <Printer size={18} />
            Export PDF
          </button>
          <button 
            onClick={downloadJpg}
            disabled={isExporting}
            className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 font-bold"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={20} />}
            Save Infographic
          </button>
        </div>
      </div>

      {/* Main Report Body */}
      <div 
        ref={reportRef} 
        id="report-content" 
        className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Banner */}
        <div className="gradient-bg px-8 md:px-12 py-16 text-white text-center">
          <div className="flex justify-center mb-4">
            {data.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest mx-1">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{data.decision}</h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg">
            Research-backed population simulation synthesized from academic, social, and economic indicators.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-16 space-y-16">
          {/* Analysis */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="text-indigo-600" />
              Strategic Insight
            </h2>
            <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-line bg-slate-50/50 p-8 rounded-3xl border border-slate-100 italic">
              {data.analysis}
            </div>
          </section>

          {/* Simulated Polls */}
          <section className="space-y-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold text-slate-900">Sentiment Simulations</h2>
              <span className="text-slate-400 text-sm font-medium">Synthetic N=10,000 Weighted Observations</span>
            </div>
            <div id="polls-grid-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 poll-grid">
              {data.polls.map((poll) => (
                <div key={poll.id} className="poll-card h-full">
                  <PollCard poll={poll} />
                </div>
              ))}
            </div>
          </section>

          {/* Citations */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Reference Grounding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.citations.map((cite, i) => (
                <a 
                  key={`${cite.url}-${i}`} 
                  href={cite.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{cite.source}</span>
                    <span className="font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{cite.title}</span>
                  </div>
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Follow Up & Interaction */}
      <div className="no-print space-y-8">
        <div className="glass-panel p-8 rounded-[2rem] border-indigo-100 shadow-xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Sparkles className="text-amber-500" />
            Dig Deeper
          </h3>
          <p className="text-slate-600 mb-6">
            Refine the data by asking follow-up questions about specific demographics, potential risks, or alternative timelines. New insights will append to this report.
          </p>
          <form onSubmit={handleFollowUpSubmit} className="relative">
            <input 
              type="text"
              value={followUpQuery}
              onChange={(e) => setFollowUpQuery(e.target.value)}
              placeholder="Ask a follow-on question..."
              className="w-full pl-6 pr-20 py-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-lg shadow-inner"
            />
            <button 
              type="submit"
              disabled={!followUpQuery.trim()}
              className="absolute right-3 top-3 bottom-3 px-6 gradient-bg text-white rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Ask
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};