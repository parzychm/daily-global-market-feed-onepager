export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`;
  return `$${mc.toLocaleString()}`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toString();
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60_000);
  
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function changeColor(pct: number): string {
  if (pct > 0) return 'text-gain';
  if (pct < 0) return 'text-loss';
  return 'text-neutral';
}

export function changeBg(pct: number): string {
  if (pct > 0) return 'bg-gain/10';
  if (pct < 0) return 'bg-loss/10';
  return 'bg-neutral/10';
}

export function heatmapColor(pct: number): string {
  if (pct > 5) return '#15803d';
  if (pct > 3) return '#16a34a';
  if (pct > 1) return '#22c55e';
  if (pct > 0) return '#4ade80';
  if (pct === 0) return '#6b7280';
  if (pct > -1) return '#f87171';
  if (pct > -3) return '#ef4444';
  if (pct > -5) return '#dc2626';
  return '#991b1b';
}
