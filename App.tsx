
import React, { useState, useEffect, useCallback } from 'react';
import { DecisionForm } from './components/DecisionForm';
import { Report } from './components/Report';
import { fetchResearchAndSimulate } from './geminiService';
import { AppState, DecisionType, SurveyData } from './types';
import { Bot, Loader2, History, Trash2, ArrowRight, Cloud, CloudOff, Globe } from 'lucide-react';
import { 
  saveSimulationToFirestore, 
  getSimulationsFromFirestore, 
  deleteSimulationFromFirestore,
  isCloudAvailable
} from './lib/firebase';

const THEMES: Record<DecisionType | 'Default', any> = {
  'Career': { from: '#10b981', to: '#064e3b', glow: 'rgba(16, 185, 129, 0.15)', bg: '#f0fdf4' },
  'Business': { from: '#1e3a8a', to: '#0f172a', glow: 'rgba(30, 58, 138, 0.1)', bg: '#f8fafc' },
  'Lifestyle': { from: '#f43f5e', to: '#f59e0b', glow: 'rgba(244, 63, 94, 0.15)', bg: '#fffafb' },
  'Investment': { from: '#d97706', to: '#000000', glow: 'rgba(217, 119, 6, 0.1)', bg: '#fffbeb' },
  'Personal': { from: '#6366f1', to: '#a855f7', glow: 'rgba(99, 102, 241, 0.15)', bg: '#f5f3ff' },
  'Default': { from: '#6366f1', to: '#a855f7', glow: 'rgba(99, 102, 241, 0.15)', bg: '#f8fafc' }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    stage: 'setup',
    surveyData: null,
    loading: false,
    archive: [],
  });
  
  const [activeTheme, setActiveTheme] = useState<DecisionType | 'Default'>('Default');
  const [syncStatus, setSyncStatus] = useState({ loading: false, connected: false });

  /** 1. Theme Orchestration */
  useEffect(() => {
    const theme = THEMES[activeTheme];
    document.documentElement.style.setProperty('--brand-from', theme.from);
    document.documentElement.style.setProperty('--brand-to', theme.to);
    document.documentElement.style.setProperty('--brand-glow', theme.glow);
    document.body.style.backgroundColor = theme.bg;
  }, [activeTheme]);

  /** 2. Persistence Synchronization */
  useEffect(() => {
    const initStorage = async () => {
      setSyncStatus(s => ({ ...s, loading: true }));
      const items = await getSimulationsFromFirestore();
      setState(prev => ({ ...prev, archive: items }));
      setSyncStatus({ loading: false, connected: isCloudAvailable() });
    };
    initStorage();
  }, []);

  /** 3. Core Actions */
  const runSimulation = async (decision: string, tags: DecisionType[]) => {
    setState(s => ({ ...s, loading: true }));
    try {
      const data = await fetchResearchAndSimulate(decision, tags);
      await saveSimulationToFirestore(data);
      setState(s => ({ ...s, stage: 'results', surveyData: data, loading: false, archive: [data, ...s.archive] }));
      if (tags[0]) setActiveTheme(tags[0]);
    } catch (err) {
      alert("Synthesis failed. Check connectivity.");
      setState(s => ({ ...s, loading: false }));
    }
  };

  const clearHistory = async () => {
    if (confirm("Permanently delete research history?")) {
      await Promise.all(state.archive.map(i => deleteSimulationFromFirestore(i.id)));
      setState(s => ({ ...s, archive: [] }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-glow z-0 theme-transition" />

      {/* Persistent Navigation */}
      <nav className="p-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setState(s => ({ ...s, stage: 'setup' }))}>
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg"><Bot size={24} /></div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">ARIA</span>
        </div>
        
        <div className="hidden md:flex gap-4">
          <StatusBadge active={syncStatus.connected} label={syncStatus.connected ? "Cloud Synced" : "Local Only"} icon={syncStatus.connected ? <Cloud size={14} /> : <CloudOff size={14} />} />
          <StatusBadge active={true} label="Live Grounding" icon={<Globe size={14} />} color="bg-green-50 text-green-700 border-green-100" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow px-6 py-12 relative z-10">
        {state.stage === 'setup' ? (
          <div className="max-w-6xl mx-auto space-y-24">
            <header className="text-center space-y-6">
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter">
                Research <span className="text-transparent bg-clip-text">Redefined.</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Empower your biggest life decisions with forensic data simulation.</p>
              <DecisionForm onSubmit={runSimulation} loading={state.loading} onTagsChange={t => setActiveTheme(t[0] || 'Default')} />
            </header>

            {state.archive.length > 0 && (
              <ArchiveGrid archive={state.archive} onSelect={item => { setState(s => ({ ...s, stage: 'results', surveyData: item })); setActiveTheme(item.tags[0]); }} onClear={clearHistory} />
            )}
          </div>
        ) : (
          state.surveyData && <Report data={state.surveyData} onReset={() => setState(s => ({ ...s, stage: 'setup' }))} />
        )}
      </main>
    </div>
  );
};

const StatusBadge = ({ active, label, icon, color }: any) => (
  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm transition-all ${color || (active ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100')}`}>
    {icon} {label}
  </div>
);

const ArchiveGrid = ({ archive, onSelect, onClear }: any) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center border-b pb-6">
      <h2 className="text-3xl font-black text-slate-900">Research Archive</h2>
      <button onClick={onClear} className="text-slate-400 hover:text-rose-500 flex items-center gap-2 text-sm font-bold"><Trash2 size={16} /> Clear History</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {archive.map((item: any) => (
        <button key={item.id} onClick={() => onSelect(item)} className="p-8 bg-white rounded-[2.5rem] border hover:shadow-2xl transition-all text-left group">
          <div className="flex gap-2 mb-4">{item.tags.map((t: any) => <span key={t} className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{t}</span>)}</div>
          <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600">{item.decision}</h4>
        </button>
      ))}
    </div>
  </div>
);

export default App;
