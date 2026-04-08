import { useState } from 'react';
import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchGainersLosers } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { formatPrice, formatPercent, changeColor } from '../utils/format';
import { SkeletonRows } from './Skeleton';

type Tab = 'gainers' | 'losers' | 'active';

export default function MoversWidget() {
  const { state } = useDashboard();
  const [tab, setTab] = useState<Tab>('gainers');
  const { data, loading } = usePolling(
    fetchGainersLosers,
    state.refreshInterval * 1000,
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'gainers', label: 'Gainers' },
    { key: 'losers', label: 'Losers' },
    { key: 'active', label: 'Active' },
  ];

  const items = data ? data[tab] : [];

  return (
    <WidgetCard
      title="Gainers / Losers"
      icon="🔄"
      headerRight={
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'bg-accent/20 text-accent'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((stock) => (
            <div
              key={stock.symbol}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white font-semibold text-xs w-12 flex-shrink-0">
                  {stock.symbol}
                </span>
                <span className="text-white/40 text-xs truncate">
                  {stock.name}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-white/70 font-mono text-xs">
                  ${formatPrice(stock.price)}
                </span>
                <span className={`font-mono text-xs font-semibold min-w-[60px] text-right ${changeColor(stock.changePercent)}`}>
                  {formatPercent(stock.changePercent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">No data available.</p>
      )}
    </WidgetCard>
  );
}
