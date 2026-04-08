import { useDashboard } from '../context/DashboardContext';
import type { Region } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { state, dispatch } = useDashboard();

  if (!isOpen) return null;

  const regions: { key: Region; label: string; flag: string }[] = [
    { key: 'US', label: 'United States', flag: '🇺🇸' },
    { key: 'EU', label: 'Europe', flag: '🇪🇺' },
    { key: 'ASIA', label: 'Asia Pacific', flag: '🌏' },
  ];

  const intervals = [
    { value: 60, label: '1 min' },
    { value: 300, label: '5 min' },
    { value: 900, label: '15 min' },
    { value: 0, label: 'Manual' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-surface-800 border-l border-white/10 z-50 overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          {/* Theme */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Theme
            </h3>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => dispatch({ type: 'SET_THEME', payload: t })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    state.theme === t
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              ))}
            </div>
          </section>

          {/* Region */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Market Region
            </h3>
            <div className="space-y-2">
              {regions.map((r) => (
                <button
                  key={r.key}
                  onClick={() => dispatch({ type: 'SET_REGION', payload: r.key })}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    state.region === r.key
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span>{r.flag}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Refresh Interval */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Auto-Refresh
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {intervals.map((i) => (
                <button
                  key={i.value}
                  onClick={() => dispatch({ type: 'SET_REFRESH_INTERVAL', payload: i.value })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    state.refreshInterval === i.value
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </section>

          {/* Widgets Toggle */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Widgets
            </h3>
            <div className="space-y-1">
              {state.widgets.map((w) => (
                <label
                  key={w.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={w.enabled}
                    onChange={() => dispatch({ type: 'TOGGLE_WIDGET', payload: w.id })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/30"
                  />
                  <span className="text-sm">{w.icon}</span>
                  <span className={`text-sm ${w.enabled ? 'text-white/80' : 'text-white/30'}`}>
                    {w.title}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* TradingView Watchlist Symbols */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              TradingView Watchlist Symbols
            </h3>
            <p className="text-xs text-white/30 mb-3">
              These symbols appear in the TradingView Watchlist widget and Custom Watchlist.
              The chart defaults to the first symbol.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {state.tradingViewSymbols.map((sym) => (
                <span
                  key={sym}
                  className="inline-flex items-center gap-1 bg-white/5 text-white/60 text-xs px-2 py-1 rounded border border-white/10"
                >
                  {sym}
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_TV_SYMBOL', payload: sym })}
                    className="text-white/30 hover:text-loss transition-colors"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Reset */}
          <section>
            <button
              onClick={() => {
                dispatch({ type: 'RESET_DEFAULTS' });
                onClose();
              }}
              className="w-full px-4 py-2 rounded-lg bg-loss/10 text-loss border border-loss/20 text-sm font-medium hover:bg-loss/20 transition-colors"
            >
              Reset to Defaults
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
