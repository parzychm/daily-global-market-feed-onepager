import { useState, useMemo } from 'react';
import { useDashboard } from './context/DashboardContext';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import TickerBar from './components/TickerBar';
import MarketSummaryWidget from './components/MarketSummaryWidget';
import TradingViewNewsWidget from './components/TradingViewNewsWidget';
import HeatmapWidget from './components/HeatmapWidget';
import TradingViewChartWidget from './components/TradingViewChartWidget';
import StandoutsWidget from './components/StandoutsWidget';
import SectorsWidget from './components/SectorsWidget';
import MoversWidget from './components/MoversWidget';
import TradingViewWatchlistWidget from './components/TradingViewWatchlistWidget';
import WatchlistWidget from './components/WatchlistWidget';
import PredictionsWidget from './components/PredictionsWidget';
import CryptoWidget from './components/CryptoWidget';
import FixedIncomeWidget from './components/FixedIncomeWidget';
import type { WidgetId } from './types';
import XtbWatchlistTab from './components/XtbWatchlistTab';

const WIDGET_COMPONENTS: Record<WidgetId, React.ComponentType> = {
  ticker: TickerBar,
  summary: MarketSummaryWidget,
  tradingviewNews: TradingViewNewsWidget,
  heatmap: HeatmapWidget,
  tradingviewChart: TradingViewChartWidget,
  news: MarketSummaryWidget, // fallback — news is shown via TradingView now
  standouts: StandoutsWidget,
  sectors: SectorsWidget,
  movers: MoversWidget,
  tradingviewWatchlist: TradingViewWatchlistWidget,
  watchlist: WatchlistWidget,
  predictions: PredictionsWidget,
  crypto: CryptoWidget,
  fixedIncome: FixedIncomeWidget,
};

// Layout grid definitions: how widgets map to CSS grid areas
const GRID_LAYOUT: { id: WidgetId; colSpan: string; rowSpan?: string }[] = [
  { id: 'ticker', colSpan: 'col-span-full', rowSpan: 'row-span-1' },
  { id: 'summary', colSpan: 'col-span-full lg:col-span-8' },
  { id: 'tradingviewNews', colSpan: 'col-span-full lg:col-span-4' },
  { id: 'heatmap', colSpan: 'col-span-full lg:col-span-8' },
  { id: 'tradingviewChart', colSpan: 'col-span-full lg:col-span-4' },
  { id: 'standouts', colSpan: 'col-span-full' },
  { id: 'sectors', colSpan: 'col-span-full md:col-span-6 lg:col-span-4' },
  { id: 'movers', colSpan: 'col-span-full md:col-span-6 lg:col-span-4' },
  { id: 'tradingviewWatchlist', colSpan: 'col-span-full lg:col-span-4' },
  { id: 'watchlist', colSpan: 'col-span-full md:col-span-6 lg:col-span-4' },
  { id: 'predictions', colSpan: 'col-span-full md:col-span-6 lg:col-span-4' },
  { id: 'crypto', colSpan: 'col-span-full lg:col-span-4' },
  { id: 'fixedIncome', colSpan: 'col-span-full' },
];

export default function App() {
  const { state } = useDashboard();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'xtb'>('market');

  const enabledWidgets = useMemo(() => {
    const enabled = new Set(
      state.widgets.filter((w) => w.enabled).map((w) => w.id)
    );
    return GRID_LAYOUT.filter((item) => enabled.has(item.id));
  }, [state.widgets]);

  const bgClass = state.theme === 'dark' ? 'bg-surface-950 text-white' : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {/* ── Tab navigation ─────────────────────────────────────────── */}
        <div className="flex items-end gap-0 mb-5 border-b border-white/10">
          {([
            { id: 'market', label: '🌐 Market Review' },
            { id: 'xtb',    label: '⭐ XTB Watchlist' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {label}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* ── Market Review tab ──────────────────────────────────────── */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-12 gap-4">
            {enabledWidgets.map(({ id, colSpan }) => {
              const Component = WIDGET_COMPONENTS[id];
              if (!Component) return null;

              if (id === 'ticker') {
                return (
                  <div key={id} className={`${colSpan} h-14`}>
                    <Component />
                  </div>
                );
              }

              return (
                <div
                  key={id}
                  className={`${colSpan} min-h-[320px]`}
                >
                  <Component />
                </div>
              );
            })}
          </div>
        )}

        {/* ── XTB Watchlist tab ──────────────────────────────────────── */}
        {activeTab === 'xtb' && <XtbWatchlistTab />}

        {/* Footer */}
        <footer className="mt-8 pb-6 text-center">
          <p className="text-xs text-white/20">
            Daily Global Market Feed • Data from{' '}
            <a href="https://financialmodelingprep.com/" target="_blank" rel="noopener" className="text-accent/40 hover:text-accent/60">
              FMP
            </a>
            {' • '}
            Charts & news by{' '}
            <a href="https://www.tradingview.com/" target="_blank" rel="noopener" className="text-accent/40 hover:text-accent/60">
              TradingView
            </a>
            {' • '}
            Crypto by{' '}
            <a href="https://www.coingecko.com/" target="_blank" rel="noopener" className="text-accent/40 hover:text-accent/60">
              CoinGecko
            </a>
            {' • '}
            Predictions by{' '}
            <a href="https://polymarket.com/" target="_blank" rel="noopener" className="text-accent/40 hover:text-accent/60">
              Polymarket
            </a>
          </p>
          <p className="text-[10px] text-white/10 mt-1">
            For informational purposes only. Not financial advice.
          </p>
        </footer>
      </main>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
