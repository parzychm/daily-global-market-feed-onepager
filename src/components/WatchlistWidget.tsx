import { useState } from 'react';
import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchWatchlistQuotes } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { formatPrice, formatPercent, changeColor } from '../utils/format';
import { SkeletonRows } from './Skeleton';

export default function WatchlistWidget() {
  const { state, dispatch } = useDashboard();
  const [newSymbol, setNewSymbol] = useState('');

  const { data, loading } = usePolling(
    () => fetchWatchlistQuotes(state.tradingViewSymbols),
    state.refreshInterval * 1000,
    [state.tradingViewSymbols.join(',')]
  );

  const handleAdd = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (sym) {
      dispatch({ type: 'ADD_TV_SYMBOL', payload: sym });
      setNewSymbol('');
    }
  };

  return (
    <WidgetCard
      title="Custom Watchlist"
      icon="⭐"
      headerRight={
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="+ Add symbol"
            className="bg-white/5 text-white text-xs px-2 py-1 rounded border border-white/10 focus:border-accent/50 focus:outline-none w-24"
          />
          <button
            onClick={handleAdd}
            className="text-accent text-xs px-2 py-1 hover:bg-accent/10 rounded transition-colors"
          >
            Add
          </button>
        </div>
      }
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : data && data.length > 0 ? (
        <div className="space-y-1">
          {data.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between px-2 py-2 rounded hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-white font-semibold text-xs w-12 flex-shrink-0">
                  {item.symbol}
                </span>
                <span className="text-white/40 text-xs truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Mini sparkline using SVG */}
                {item.sparkline.length > 0 && (
                  <svg
                    width="60"
                    height="20"
                    viewBox="0 0 60 20"
                    className="opacity-60"
                  >
                    <polyline
                      fill="none"
                      stroke={item.changePercent >= 0 ? '#22c55e' : '#ef4444'}
                      strokeWidth="1.5"
                      points={item.sparkline
                        .map((v, i) => {
                          const min = Math.min(...item.sparkline);
                          const max = Math.max(...item.sparkline);
                          const range = max - min || 1;
                          const x = (i / (item.sparkline.length - 1)) * 60;
                          const y = 20 - ((v - min) / range) * 18;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  </svg>
                )}
                <span className="text-white/70 font-mono text-xs">
                  ${formatPrice(item.price)}
                </span>
                <span className={`font-mono text-xs font-semibold min-w-[55px] text-right ${changeColor(item.changePercent)}`}>
                  {formatPercent(item.changePercent)}
                </span>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_TV_SYMBOL', payload: item.symbol })}
                  className="text-white/20 hover:text-loss text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  title="Remove from watchlist"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-white/40 text-sm">Your watchlist is empty.</p>
          <p className="text-white/20 text-xs mt-1">Add symbols above to get started.</p>
        </div>
      )}
    </WidgetCard>
  );
}
