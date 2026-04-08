import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchSectorPerformance } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { formatPercent, changeColor, changeBg } from '../utils/format';
import { SkeletonRows } from './Skeleton';

export default function SectorsWidget() {
  const { state } = useDashboard();
  const { data, loading } = usePolling(
    fetchSectorPerformance,
    state.refreshInterval * 1000,
  );

  return (
    <WidgetCard title="Equity Sectors" icon="🏢">
      {loading ? (
        <SkeletonRows rows={6} />
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((sector) => (
            <div
              key={sector.name}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${changeBg(sector.changePercent)} transition-colors`}
            >
              <span className="text-white/80 text-xs font-medium truncate mr-3">
                {sector.name}
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                {sector.price > 0 && (
                  <span className="text-white/50 font-mono text-xs">
                    ${sector.price.toFixed(2)}
                  </span>
                )}
                <span className={`font-mono text-xs font-semibold min-w-[60px] text-right ${changeColor(sector.changePercent)}`}>
                  {formatPercent(sector.changePercent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">No sector data.</p>
      )}
    </WidgetCard>
  );
}
