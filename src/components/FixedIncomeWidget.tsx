import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchBondETFs } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { formatPercent, changeColor, changeBg } from '../utils/format';
import { SkeletonRows } from './Skeleton';

export default function FixedIncomeWidget() {
  const { state } = useDashboard();
  const { data, loading } = usePolling(
    fetchBondETFs,
    state.refreshInterval * 1000,
  );

  return (
    <WidgetCard title="Fixed Income" icon="🏦">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {data.map((bond) => (
            <div
              key={bond.symbol}
              className={`p-3 rounded-lg ${changeBg(bond.changePercent)} border border-white/5 text-center`}
            >
              <div className="text-white/50 text-[10px] font-medium mb-1">{bond.name}</div>
              <div className="text-white font-mono text-sm">${bond.price.toFixed(2)}</div>
              <div className={`font-mono text-xs font-semibold mt-1 ${changeColor(bond.changePercent)}`}>
                {formatPercent(bond.changePercent)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">No fixed income data.</p>
      )}
    </WidgetCard>
  );
}
