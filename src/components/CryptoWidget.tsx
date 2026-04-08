import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchCrypto } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { formatPrice, formatPercent, changeColor, formatMarketCap } from '../utils/format';
import { SkeletonRows } from './Skeleton';

export default function CryptoWidget() {
  const { state } = useDashboard();
  const { data, loading } = usePolling(
    fetchCrypto,
    state.refreshInterval * 1000,
  );

  return (
    <WidgetCard title="Popular Cryptocurrencies" icon="₿">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between px-2 py-2 rounded hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={coin.imageUrl}
                  alt={coin.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <span className="text-white font-semibold text-xs">{coin.symbol}</span>
                  <span className="text-white/30 text-xs ml-1.5">{coin.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-white/50 text-[10px] font-mono">
                  {formatMarketCap(coin.marketCap)}
                </span>
                <span className="text-white/70 font-mono text-xs min-w-[70px] text-right">
                  ${formatPrice(coin.price)}
                </span>
                <span className={`font-mono text-xs font-semibold min-w-[55px] text-right ${changeColor(coin.changePercent)}`}>
                  {formatPercent(coin.changePercent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">No crypto data.</p>
      )}
    </WidgetCard>
  );
}
