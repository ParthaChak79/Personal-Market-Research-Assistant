import { useState, useEffect } from 'react';
import { DecisionType } from '../types';

const THEMES: Record<DecisionType | 'Default', any> = {
  'Career': { from: '#10b981', to: '#064e3b', glow: 'rgba(16, 185, 129, 0.15)', bg: '#f0fdf4', colorClass: 'from-emerald-400 to-emerald-600' },
  'Business': { from: '#1e3a8a', to: '#0f172a', glow: 'rgba(30, 58, 138, 0.1)', bg: '#f8fafc', colorClass: 'from-slate-700 to-slate-900' },
  'Lifestyle': { from: '#f43f5e', to: '#f59e0b', glow: 'rgba(244, 63, 94, 0.15)', bg: '#fffafb', colorClass: 'from-rose-400 to-amber-500' },
  'Investment': { from: '#d97706', to: '#000000', glow: 'rgba(217, 119, 6, 0.1)', bg: '#fffbeb', colorClass: 'from-amber-500 to-slate-900' },
  'Personal': { from: '#6366f1', to: '#a855f7', glow: 'rgba(99, 102, 241, 0.15)', bg: '#f5f3ff', colorClass: 'from-indigo-500 to-purple-600' },
  'Default': { from: '#6366f1', to: '#a855f7', glow: 'rgba(99, 102, 241, 0.15)', bg: '#f8fafc', colorClass: 'from-indigo-500 to-purple-600' }
};

export const useTheme = () => {
  const [activeTheme, setActiveTheme] = useState<DecisionType | 'Default'>('Default');

  useEffect(() => {
    const theme = THEMES[activeTheme];
    document.documentElement.style.setProperty('--brand-from', theme.from);
    document.documentElement.style.setProperty('--brand-to', theme.to);
    document.documentElement.style.setProperty('--brand-glow', theme.glow);
    document.body.style.backgroundColor = theme.bg;
  }, [activeTheme]);

  const getTagColor = (tags: DecisionType[]) => {
    const tag = tags[0] || 'Default';
    return THEMES[tag]?.colorClass || THEMES.Default.colorClass;
  };

  return { activeTheme, setActiveTheme, getTagColor };
};