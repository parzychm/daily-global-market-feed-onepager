import { useDashboard } from '../context/DashboardContext';
import type { Region } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const { state, dispatch } = useDashboard();

  const regions: { key: Region; label: string; flag: string }[] = [
    { key: 'US', label: 'US', flag: '🇺🇸' },
    { key: 'EU', label: 'EU', flag: '🇪🇺' },
    { key: 'ASIA', label: 'Asia', flag: '🌏' },
  ];

  return (
    <header className="bg-surface-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
              <path d="M20 70 L35 45 L50 55 L65 30 L80 40" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Daily Global Market Feed
            </h1>
            <p className="text-[10px] text-white/30">
              One-pager dashboard • Real-time data • Customizable
            </p>
          </div>
        </div>

        {/* Region Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {regions.map((r) => (
              <button
                key={r.key}
                onClick={() => dispatch({ type: 'SET_REGION', payload: r.key })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  state.region === r.key
                    ? 'bg-accent/20 text-accent'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <span className="mr-1">{r.flag}</span>
                {r.label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })}
            className="text-white/40 hover:text-white/70 transition-colors text-lg"
            title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {state.theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            Customize
          </button>
        </div>
      </div>
    </header>
  );
}
