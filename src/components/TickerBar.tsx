import { useDashboard } from '../context/DashboardContext';
import { usePolling } from '../hooks/usePolling';
import { fetchTickerData, isUsingDemoKey } from '../services/marketData';
import { REGION_INDICES } from '../config/defaults';
import { formatPrice, formatPercent, changeColor } from '../utils/format';

const FX_SYMBOLS = new Set(['EURUSD', 'GBPUSD', 'USDJPY', 'USDCNY', 'AUDUSD', 'USDCHF', 'USDCAD']);

export default function TickerBar() {
  const { state } = useDashboard();
  const symbols = REGION_INDICES[state.region].map(i => i.symbol);

  const { data } = usePolling(
    () => fetchTickerData(symbols),
    state.refreshInterval * 1000,
    [symbols.join(',')]
  );

  const regionLabels = REGION_INDICES[state.region];
  const items = data || regionLabels.map(r => ({
    symbol: r.symbol,
    name: r.name,
    price: 0,
    change: 0,
    changePercent: 0,
  }));

  // Double the items for infinite scroll effect
  const doubled = [...items, ...items];

  const demo = isUsingDemoKey();

  return (
    <div className="bg-surface-800 border-b border-white/5 overflow-hidden h-full flex items-center">
      {demo && (
        <span className="shrink-0 ml-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
          DEMO
        </span>
      )}
      <div className="ticker-scroll flex items-center gap-8 whitespace-nowrap px-4">
        {doubled.map((item, i) => {
          const isFx = FX_SYMBOLS.has(item.symbol);
          return (
            <div key={`${item.symbol}-${i}`} className="flex items-center gap-3 py-2">
              <span className="text-white/60 text-xs font-medium">
                {regionLabels[i % regionLabels.length]?.name || item.symbol}
              </span>
              <span className="text-white font-mono text-sm font-medium">
                {isFx ? '' : '$'}{formatPrice(item.price)}
              </span>
              <span className={`font-mono text-xs font-medium ${changeColor(item.changePercent)}`}>
                {formatPercent(item.changePercent)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
