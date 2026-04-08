import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchPredictions } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { SkeletonRows } from './Skeleton';

export default function PredictionsWidget() {
  const { state } = useDashboard();
  const { data, loading } = usePolling(
    fetchPredictions,
    state.refreshInterval * 1000,
  );

  return (
    <WidgetCard title="Prediction Markets" icon="🔮">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((market) => (
            <div
              key={market.id}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/5"
            >
              <h4 className="text-xs font-semibold text-white/80 mb-2">{market.question}</h4>
              <div className="space-y-1.5">
                {market.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-accent/30 rounded-full flex items-center px-2"
                        style={{ width: `${Math.max(opt.probability, 5)}%` }}
                      >
                        <span className="text-[10px] text-white/80 whitespace-nowrap">
                          {opt.label}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-white/70 w-10 text-right">
                      {opt.probability}%
                    </span>
                    <span className={`text-[10px] font-mono w-10 text-right ${
                      opt.change > 0 ? 'text-gain' : opt.change < 0 ? 'text-loss' : 'text-white/30'
                    }`}>
                      {opt.change > 0 ? '+' : ''}{opt.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-white/30">{market.volume} vol.</span>
                <span className="text-[10px] text-accent/50">on {market.source}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">No predictions available.</p>
      )}
    </WidgetCard>
  );
}
