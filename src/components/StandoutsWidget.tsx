import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchStandouts } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { formatPrice, formatPercent, formatMarketCap, changeColor } from '../utils/format';
import { SkeletonRows } from './Skeleton';

export default function StandoutsWidget() {
  const { state } = useDashboard();
  const { data, loading } = usePolling(
    fetchStandouts,
    state.refreshInterval * 1000,
  );

  return (
    <WidgetCard title="Standouts" icon="⭐">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((stock) => (
            <div
              key={stock.symbol}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/5 card-hover"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{stock.symbol}</span>
                    <span className="text-white/40 text-xs">{stock.exchange}</span>
                  </div>
                  <span className="text-white/50 text-xs">{stock.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">${formatPrice(stock.price)}</div>
                  <div className={`font-mono text-xs font-semibold ${changeColor(stock.changePercent)}`}>
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                {stock.marketCap > 0 && (
                  <div>
                    <span className="text-white/30">Mkt Cap</span>
                    <div className="text-white/70 font-mono">{formatMarketCap(stock.marketCap)}</div>
                  </div>
                )}
                {stock.peRatio > 0 && (
                  <div>
                    <span className="text-white/30">P/E</span>
                    <div className="text-white/70 font-mono">{stock.peRatio.toFixed(2)}</div>
                  </div>
                )}
                {stock.dividendYield > 0 && (
                  <div>
                    <span className="text-white/30">Div Yield</span>
                    <div className="text-white/70 font-mono">{stock.dividendYield.toFixed(2)}%</div>
                  </div>
                )}
              </div>

              <p className="text-white/40 text-xs leading-relaxed line-clamp-3">
                {stock.explanation}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">No standouts data.</p>
      )}
    </WidgetCard>
  );
}
