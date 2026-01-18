import React, { useState, useEffect, useCallback } from 'react';
import { DecisionForm } from './components/DecisionForm';
import { Report } from './components/Report';
import { fetchResearchAndSimulate } from './geminiService';
import { AppState, DecisionType, SurveyData } from './types';
import { Bot, Loader2, FileText, History, Trash2, ArrowRight, Calendar, Layers, Cloud, CloudOff } from 'lucide-react';
import { 
  saveSimulationToFirestore, 
  getSimulationsFromFirestore, 
  deleteSimulationFromFirestore,
  isCloudAvailable
} from './lib/firebase';

const THEMES: Record<DecisionType | 'Default', { from: string; to: string; glow: string; bg: string }> = {
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [activeTheme, setActiveTheme] = useState<DecisionType | 'Default'>('Default');

  // Update CSS variables when theme changes
  useEffect(() => {
    const theme = THEMES[activeTheme];
    document.documentElement.style.setProperty('--brand-from', theme.from);
    document.documentElement.style.setProperty('--brand-to', theme.to);
    document.documentElement.style.setProperty('--brand-glow', theme.glow);
    document.body.style.backgroundColor = theme.bg;
  }, [activeTheme]);

  // Load archive and check connectivity on mount
  useEffect(() => {
    const loadArchive = async () => {
      setIsSyncing(true);
      const simulations = await getSimulationsFromFirestore();
      setState(prev => ({ ...prev, archive: simulations }));
      setCloudConnected(isCloudAvailable());
      setIsSyncing(false);
    };
    loadArchive();
  }, []);

  const handleStartResearch = async (decision: string, tags: DecisionType[]) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const data = await fetchResearchAndSimulate(decision, tags);
      await saveSimulationToFirestore(data);

      setState(prev => ({
        ...prev,
        stage: 'results',
        surveyData: data,
        loading: false,
        archive: [data, ...prev.archive].slice(0, 20),
      }));
      // Set theme based on the first/dominant tag of the new result
      if (tags.length > 0) setActiveTheme(tags[0]);
    } catch (error) {
      console.error("Research failed:", error);
      alert("Failed to synthesize data. ARIA will try to keep you in local mode.");
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleThemeChange = useCallback((tags: DecisionType[]) => {
    if (tags.length > 0) {
      setActiveTheme(tags[tags.length - 1]);
    } else {
      setActiveTheme('Default');
    }
  }, []);

  const loadFromArchive = (item: SurveyData) => {
    setState(prev => ({
      ...prev,
      stage: 'results',
      surveyData: item,
    }));
    if (item.tags.length > 0) setActiveTheme(item.tags[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearArchive = async () => {
    if (confirm("Clear your simulation archive? This will affect your cloud and local storage.")) {
      setIsSyncing(true);
      await Promise.all(state.archive.map(item => deleteSimulationFromFirestore(item.id)));
      setState(prev => ({ ...prev, archive: [] }));
      setIsSyncing(false);
    }
  };

  const reset = () => {
    setState(prev => ({
      ...prev,
      stage: 'setup',
      surveyData: null,
      loading: false,
    }));
    setActiveTheme('Default');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTagColor = (tags: DecisionType[]) => {
    if (tags.includes('Business')) return 'from-slate-700 to-slate-900 shadow-slate-100';
    if (tags.includes('Career')) return 'from-emerald-500 to-teal-800 shadow-emerald-100';
    if (tags.includes('Investment')) return 'from-amber-500 to-orange-900 shadow-amber-100';
    if (tags.includes('Lifestyle')) return 'from-rose-500 to-orange-400 shadow-rose-100';
    return 'from-blue-500 to-indigo-600 shadow-blue-100';
  };

  return (
    <div className="min-h-screen selection:bg-indigo-100 flex flex-col relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 bg-glow z-0 theme-transition" />

      <nav className="p-6 flex items-center justify-between no-print sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-700">
            <Bot size={24} />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight uppercase">ARIA</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm transition-all ${
            cloudConnected 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
              : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
            {cloudConnected ? <Cloud size={14} /> : <CloudOff size={14} />}
            {cloudConnected ? `${state.archive.length} Cloud Saved` : 'Offline Mode (Local Storage)'}
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Grounding Active
          </div>
        </div>
      </nav>

      {state.loading && state.stage === 'results' && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-slate-100 border-t-[var(--brand-from)] rounded-full animate-spin theme-transition"></div>
            <Bot className="absolute inset-0 m-auto text-[var(--brand-from)] theme-transition" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mt-8">Synthesizing Scenarios...</h2>
          <p className="text-slate-500 mt-2 font-medium">Scouring global trends & academic data for high-fidelity simulations.</p>
        </div>
      )}

      <main className="flex-grow px-6 py-12 relative z-10">
        {state.stage === 'setup' ? (
          <div className="max-w-6xl mx-auto flex flex-col items-center space-y-32">
            <div className="text-center space-y-6 max-w-4xl">
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                Your Personal Research <span className="text-transparent bg-clip-text">Assistant.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
                The world's first research agent using Gemini 3's real-time search to simulate human responses to your biggest decision choices.
              </p>
              <div className="pt-8">
                <DecisionForm 
                  onSubmit={handleStartResearch} 
                  loading={state.loading} 
                  onTagsChange={handleThemeChange}
                />
              </div>
            </div>

            {(state.archive.length > 0 || isSyncing) && (
              <div className="w-full space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
                <div className="flex items-end justify-between border-b border-slate-200 pb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                          <History size={24} />
                        </div>
                        Research Archive
                      </h2>
                      {isSyncing && <Loader2 size={20} className="animate-spin text-indigo-400" />}
                    </div>
                    <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
                      {cloudConnected ? <Cloud size={18} className="text-indigo-400" /> : <CloudOff size={18} className="text-amber-400" />}
                      {cloudConnected ? 'Persistent cloud storage active' : 'Storing research in local session'}
                    </p>
                  </div>
                  <button 
                    onClick={clearArchive}
                    disabled={isSyncing}
                    className="group text-slate-400 hover:text-rose-500 flex items-center gap-2 text-sm font-bold transition-all px-4 py-2 hover:bg-rose-50 rounded-xl disabled:opacity-50"
                  >
                    <Trash2 size={16} className="group-hover:shake" />
                    Clear Research History
                  </button>
                </div>

                {isSyncing && state.archive.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-slate-400">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="font-bold">Syncing simulations...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {state.archive.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadFromArchive(item)}
                        className="group flex flex-col text-left bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-200/50 hover:-translate-y-2 transition-all overflow-hidden relative"
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getTagColor(item.tags)} opacity-5 blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity`} />
                        
                        <div className="p-10 space-y-6 flex-grow flex flex-col">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {item.tags.map(tag => (
                                <span key={tag} className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-full border border-indigo-100/50">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                              <ArrowRight size={20} />
                            </div>
                          </div>

                          <h4 className="text-2xl font-black text-slate-900 leading-[1.2] group-hover:text-indigo-600 transition-colors">
                            {item.decision}
                          </h4>

                          <div className="mt-auto pt-6 flex flex-wrap gap-4 items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                              <Layers size={14} className="text-slate-300" />
                              {item.polls.length} Scenarios
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-300" />
                              {new Date(item.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`h-2 w-full bg-gradient-to-r ${getTagColor(item.tags)} transition-all duration-500 opacity-60 group-hover:opacity-100`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full pt-12">
              <div className="group space-y-4 p-8 bg-white/50 backdrop-blur-sm rounded-[2.5rem] hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-slate-100">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                  <Bot size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Logic Simulation</h3>
                <p className="text-slate-500 leading-relaxed font-medium">Models real-world responses using massive datasets of public opinion and human behavioral logic.</p>
              </div>
              <div className="group space-y-4 p-8 bg-white/50 backdrop-blur-sm rounded-[2.5rem] hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-slate-100">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                  <Loader2 size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Real-time Grounding</h3>
                <p className="text-slate-500 leading-relaxed font-medium">Retrieves active trends from Reddit, industry journals, and scholar citations via live search.</p>
              </div>
              <div className="group space-y-4 p-8 bg-white/50 backdrop-blur-sm rounded-[2.5rem] hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-slate-100">
                <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100 group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Resilient Storage</h3>
                <p className="text-slate-500 leading-relaxed font-medium">Research history is archived in the cloud, with automatic local failover if connection drops.</p>
              </div>
            </div>
          </div>
        ) : (
          state.surveyData && (
            <Report 
              data={state.surveyData} 
              onReset={reset}
            />
          )
        )}
      </main>

      <footer className="py-12 text-center text-slate-400 text-sm no-print border-t border-slate-100 bg-white relative z-10">
        <p className="font-medium">&copy; 2026 ARIA AI Research Systems. Powered by Gemini Pro with Adaptive UI.</p>
      </footer>
    </div>
  );
};

export default App;