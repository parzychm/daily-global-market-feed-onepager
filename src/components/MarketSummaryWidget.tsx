import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchMarketSummary } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { SkeletonRows } from './Skeleton';
import { timeAgo } from '../utils/format';

export default function MarketSummaryWidget() {
  const { state } = useDashboard();
  const { data, loading } = usePolling(
    fetchMarketSummary,
    state.refreshInterval * 1000,
  );

  const sentimentBadge = (sentiment: string) => {
    const cls = sentiment === 'Bullish' ? 'badge-bullish'
              : sentiment === 'Bearish' ? 'badge-bearish'
              : 'badge-neutral';
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
        {sentiment === 'Bullish' ? '▲' : sentiment === 'Bearish' ? '▼' : '●'} {sentiment} Sentiment
      </span>
    );
  };

  return (
    <WidgetCard
      title="Market Summary"
      icon="📊"
      headerRight={data && (
        <span className="text-xs text-white/40">Updated {timeAgo(data.updatedAt)}</span>
      )}
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : data ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-white leading-snug">{data.headline}</h3>
            {sentimentBadge(data.sentiment)}
          </div>
          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
            {data.body}
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <span className="text-xs text-white/30">{data.sources.length} sources</span>
            {data.sources.map((s) => (
              <span key={s} className="text-xs text-accent/70 bg-accent/10 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-white/40 text-sm">Unable to load market summary.</p>
      )}
    </WidgetCard>
  );
}
