import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchNews } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { timeAgo } from '../utils/format';
import { SkeletonRows } from './Skeleton';

export default function NewsFeedWidget() {
  const { state } = useDashboard();
  const { data, loading } = usePolling(
    fetchNews,
    state.refreshInterval * 1000,
  );

  return (
    <WidgetCard title="Recent News" icon="📰">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/5"
            >
              <div className="flex items-start gap-3">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-16 h-12 rounded object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white/90 leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-accent/70">{item.source}</span>
                    <span className="text-xs text-white/30">·</span>
                    <span className="text-xs text-white/30">{timeAgo(item.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">No news available.</p>
      )}
    </WidgetCard>
  );
}
