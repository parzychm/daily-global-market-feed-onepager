import { useEffect, useRef } from 'react';
import WidgetCard from './WidgetCard';
import { usePolling } from '../hooks/usePolling';
import { fetchHeatmapData } from '../services/marketData';
import { useDashboard } from '../context/DashboardContext';
import { heatmapColor, formatPercent } from '../utils/format';
import { SkeletonRows } from './Skeleton';

export default function HeatmapWidget() {
  const { state } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading } = usePolling(
    fetchHeatmapData,
    state.refreshInterval * 1000,
  );

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Simple CSS-based treemap (no D3 dependency needed for this layout)
    const container = containerRef.current;
    container.innerHTML = '';

    // Sort by market cap descending
    const sorted = [...data].sort((a, b) => b.marketCap - a.marketCap);
    const totalMC = sorted.reduce((s, d) => s + d.marketCap, 0);

    const grid = document.createElement('div');
    grid.className = 'grid gap-0.5 h-full w-full';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    grid.style.gridAutoRows = 'minmax(50px, 1fr)';

    sorted.forEach((item) => {
      const cell = document.createElement('div');
      const weight = item.marketCap / totalMC;
      const span = Math.max(1, Math.round(weight * 20));

      cell.style.gridColumn = span > 2 ? `span ${Math.min(span, 3)}` : 'span 1';
      cell.style.gridRow = span > 3 ? 'span 2' : 'span 1';
      cell.style.backgroundColor = heatmapColor(item.changePercent);
      cell.style.borderRadius = '4px';
      cell.style.padding = '4px 6px';
      cell.style.display = 'flex';
      cell.style.flexDirection = 'column';
      cell.style.justifyContent = 'center';
      cell.style.alignItems = 'center';
      cell.style.cursor = 'pointer';
      cell.style.transition = 'transform 0.1s';
      cell.title = `${item.name} (${item.symbol})\n${formatPercent(item.changePercent)}`;

      cell.onmouseenter = () => { cell.style.transform = 'scale(1.02)'; cell.style.zIndex = '10'; };
      cell.onmouseleave = () => { cell.style.transform = 'scale(1)'; cell.style.zIndex = '0'; };

      const sym = document.createElement('div');
      sym.className = 'text-white font-semibold text-xs leading-none';
      sym.textContent = item.symbol;

      const pct = document.createElement('div');
      pct.className = 'text-white/80 text-[10px] font-mono mt-0.5';
      pct.textContent = formatPercent(item.changePercent);

      cell.appendChild(sym);
      cell.appendChild(pct);
      grid.appendChild(cell);
    });

    container.appendChild(grid);
  }, [data]);

  return (
    <WidgetCard title="S&P 500 Heatmap" icon="🟩">
      {loading ? (
        <SkeletonRows rows={6} />
      ) : (
        <div ref={containerRef} className="h-full min-h-[200px]" />
      )}
    </WidgetCard>
  );
}
