import React, { useState, useEffect } from 'react';
import { DecisionType } from '../types';
import { Sparkles, Briefcase, User, TrendingUp, Heart, Wand2, Loader2, ArrowRight } from 'lucide-react';
import { refineDecisionQuery } from '../geminiService';

interface DecisionFormProps {
  onSubmit: (decision: string, tags: DecisionType[]) => void;
  onTagsChange?: (tags: DecisionType[]) => void;
  loading: boolean;
}

const DECISION_TYPES: { type: DecisionType; icon: React.ReactNode; color: string; activeColor: string }[] = [
  { type: 'Personal', icon: <User size={18} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', activeColor: 'bg-indigo-600 text-white border-indigo-600' },
  { type: 'Career', icon: <Briefcase size={18} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
  { type: 'Business', icon: <TrendingUp size={18} />, color: 'bg-slate-50 text-slate-600 border-slate-200', activeColor: 'bg-slate-900 text-white border-slate-900' },
  { type: 'Investment', icon: <Sparkles size={18} />, color: 'bg-amber-50 text-amber-600 border-amber-200', activeColor: 'bg-amber-600 text-white border-amber-600' },
  { type: 'Lifestyle', icon: <Heart size={18} />, color: 'bg-rose-50 text-rose-600 border-rose-200', activeColor: 'bg-rose-600 text-white border-rose-600' },
];

export const DecisionForm: React.FC<DecisionFormProps> = ({ onSubmit, onTagsChange, loading }) => {
  const [decision, setDecision] = useState('');
  const [selectedTags, setSelectedTags] = useState<DecisionType[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    if (onTagsChange) onTagsChange(selectedTags);
  }, [selectedTags, onTagsChange]);

  const toggleTag = (tag: DecisionType) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRefine = async () => {
    if (!decision.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refined = await refineDecisionQuery(decision);
      setSuggestions(refined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  const selectSuggestion = (text: string) => {
    setDecision(text);
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision.trim() && selectedTags.length > 0) {
      onSubmit(decision, selectedTags);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4 relative">
          <label className="block text-2xl font-black text-slate-800 tracking-tight text-center">
            What decision are you weighing?
          </label>
          <div className="relative group">
            <textarea
              value={decision}
              onChange={(e) => {
                setDecision(e.target.value);
                if (suggestions.length > 0) setSuggestions([]);
              }}
              placeholder="e.g., Should I transition from software engineering to product management in 2026?"
              className="w-full h-40 p-6 text-xl border border-slate-200 rounded-[2.5rem] focus:ring-8 focus:ring-[var(--brand-glow)] focus:border-[var(--brand-from)] transition-all theme-transition outline-none resize-none glass-panel shadow-sm leading-relaxed"
              disabled={loading}
            />
            {decision.length > 10 && !loading && (
              <button
                type="button"
                onClick={handleRefine}
                disabled={isRefining}
                className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isRefining ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {isRefining ? 'Refining...' : 'Refine with AI'}
              </button>
            )}
          </div>
        </div>

        {/* AI Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 text-indigo-600 px-2">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Smart Refinements</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="text-left p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group flex items-start gap-4 shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-700 leading-snug group-hover:text-slate-900">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-lg font-bold text-slate-700 text-center uppercase tracking-widest text-[10px]">Research Categories</label>
          <div className="flex flex-wrap justify-center gap-3">
            {DECISION_TYPES.map(({ type, icon, color, activeColor }) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleTag(type)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all duration-300 ${
                  selectedTags.includes(type) 
                    ? `${activeColor} shadow-lg scale-105` 
                    : `${color} hover:border-slate-300`
                }`}
                disabled={loading}
              >
                {icon}
                <span className="font-bold">{type}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !decision.trim() || selectedTags.length === 0}
          className="w-full py-5 px-8 gradient-bg text-white rounded-[2rem] font-black text-xl shadow-2xl hover:shadow-indigo-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin" />
              Synthesizing Global Insights...
            </>
          ) : (
            <>
              Initialize Simulation
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </form>
      
      {!loading && !suggestions.length && (
        <p className="text-center text-slate-400 text-sm font-medium">
          ARIA uses multi-agent reasoning to build your report.
        </p>
      )}
    </div>
  );
};