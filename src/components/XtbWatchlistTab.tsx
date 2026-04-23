import { useState, useEffect, useRef, useMemo } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useScheduledRefresh, REFRESH_OPTIONS } from '../hooks/useScheduledRefresh';
import { fetchWatchlistQuotes } from '../services/marketData';
import { formatPrice, formatPercent, changeColor } from '../utils/format';
import { SkeletonRows } from './Skeleton';

// ── XTB Watchlist (mars section) ─────────────────────────────────────────────
// Symbols from TradingView mars watchlist section (Apr 2026)

interface XtbStock {
  symbol: string;      // FMP / display ticker
  tv: string;          // Full TradingView symbol (EXCHANGE:SYMBOL)
  name: string;
  sector: string;
  skipFmp?: boolean;   // true for crypto / indices (no FMP quote)
}

const XTB_STOCKS: XtbStock[] = [
  // AI & Data Center
  { symbol: 'APLD',  tv: 'NASDAQ:APLD',       name: 'Applied Digital',       sector: 'AI Infra' },
  { symbol: 'SMCI',  tv: 'NASDAQ:SMCI',        name: 'Super Micro Computer',  sector: 'AI Infra' },
  { symbol: 'ALAB',  tv: 'NASDAQ:ALAB',        name: 'Astera Labs',           sector: 'AI Chips' },
  { symbol: 'NVDA',  tv: 'NASDAQ:NVDA',        name: 'NVIDIA',                sector: 'AI Chips' },
  { symbol: 'AMD',   tv: 'NASDAQ:AMD',         name: 'AMD',                   sector: 'AI Chips' },
  { symbol: 'TEM',   tv: 'NASDAQ:TEM',         name: 'Tempus AI',             sector: 'AI Health' },
  { symbol: 'SOUN',  tv: 'NASDAQ:SOUN',        name: 'SoundHound AI',         sector: 'Voice AI' },
  { symbol: 'SDGR',  tv: 'NASDAQ:SDGR',        name: 'Schrödinger',           sector: 'AI Pharma' },
  // Space
  { symbol: 'RKLB',  tv: 'NASDAQ:RKLB',        name: 'Rocket Lab',            sector: 'Space' },
  { symbol: 'ASTS',  tv: 'NASDAQ:ASTS',        name: 'AST SpaceMobile',       sector: 'Space' },
  { symbol: 'LUNR',  tv: 'NASDAQ:LUNR',        name: 'Intuitive Machines',    sector: 'Space' },
  // Semiconductors & Quantum
  { symbol: 'AXTI',  tv: 'NASDAQ:AXTI',        name: 'AXT Inc',               sector: 'Semis' },
  { symbol: 'CIFR',  tv: 'NASDAQ:CIFR',        name: 'Cipher Mining',         sector: 'Crypto Mining' },
  { symbol: 'RGTI',  tv: 'NASDAQ:RGTI',        name: 'Rigetti Computing',     sector: 'Quantum' },
  // Big Tech
  { symbol: 'MSFT',  tv: 'NASDAQ:MSFT',        name: 'Microsoft',             sector: 'Big Tech' },
  // EV & Materials
  { symbol: 'MVST',  tv: 'NASDAQ:MVST',        name: 'Microvast Holdings',    sector: 'EV' },
  { symbol: 'ABAT',  tv: 'NASDAQ:ABAT',        name: 'American Battery',      sector: 'EV' },
  // Speculative / Other
  { symbol: 'BFLY',  tv: 'NYSE:BFLY',          name: 'Butterfly Network',     sector: 'MedTech' },
  { symbol: 'SERV',  tv: 'NASDAQ:SERV',        name: 'Serve Robotics',        sector: 'Robotics' },
  { symbol: 'VKTX',  tv: 'NASDAQ:VKTX',        name: 'Viking Therapeutics',   sector: 'Biotech' },
  { symbol: 'SSYS',  tv: 'NASDAQ:SSYS',        name: 'Stratasys',             sector: '3D Printing' },
  { symbol: 'OPEN',  tv: 'NASDAQ:OPEN',        name: 'Opendoor Technologies', sector: 'PropTech' },
  { symbol: 'SEZL',  tv: 'NASDAQ:SEZL',        name: 'Sezzle Inc',            sector: 'Fintech' },
  // Crypto & Indices (no FMP quote — chart only)
  { symbol: 'BTC',   tv: 'BINANCE:BTCUSDT.P',  name: 'Bitcoin',               sector: 'Crypto',  skipFmp: true },
  { symbol: 'ETH',   tv: 'BINANCE:ETHUSDT.P',  name: 'Ethereum',              sector: 'Crypto',  skipFmp: true },
  { symbol: 'WIG20', tv: 'GPW:WIG20',          name: 'WIG20 Index',           sector: 'Index',   skipFmp: true },
  { symbol: 'US100', tv: 'CAPITALCOM:US100',   name: 'US 100',                sector: 'Index',   skipFmp: true },
];

const SECTOR_BADGE: Record<string, string> = {
  'AI Infra':      'text-purple-300 bg-purple-400/15',
  'AI Chips':      'text-blue-300   bg-blue-400/15',
  'AI Health':     'text-cyan-300   bg-cyan-400/15',
  'Voice AI':      'text-cyan-200   bg-cyan-300/10',
  'AI Pharma':     'text-indigo-300 bg-indigo-400/15',
  'Space':         'text-orange-300 bg-orange-400/15',
  'Semis':         'text-yellow-300 bg-yellow-400/15',
  'Crypto Mining': 'text-amber-300  bg-amber-400/15',
  'Quantum':       'text-pink-300   bg-pink-400/15',
  'Big Tech':      'text-green-300  bg-green-400/15',
  'EV':            'text-emerald-300 bg-emerald-400/15',
  'MedTech':       'text-rose-300   bg-rose-400/15',
  'Robotics':      'text-sky-300    bg-sky-400/15',
  'Biotech':       'text-fuchsia-300 bg-fuchsia-400/15',
  '3D Printing':   'text-slate-300  bg-slate-400/15',
  'PropTech':      'text-teal-300   bg-teal-400/15',
  'Fintech':       'text-lime-300   bg-lime-400/15',
  'Crypto':        'text-yellow-400 bg-yellow-400/15',
  'Index':         'text-gray-300   bg-gray-400/15',
};

// ── TradingView Advanced Chart ────────────────────────────────────────────────

function TvChart({ tvSymbol }: { tvSymbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.cssText = 'width:100%;height:100%;';

    const inner = document.createElement('div');
    inner.style.cssText = 'width:100%;height:100%;';
    wrapper.appendChild(inner);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: true,
      withdateranges: true,
      hide_volume: false,
      isTransparent: true,
      range: '3M',
    });
    wrapper.appendChild(script);
    container.appendChild(wrapper);

    return () => { container.innerHTML = ''; };
  }, [tvSymbol]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ── TradingView Timeline (per-symbol news) ────────────────────────────────────

function TvTimeline({ tvSymbol }: { tvSymbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.cssText = 'width:100%;height:100%;';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.type = 'text/javascript';
    script.async = true;
    script.textContent = JSON.stringify({
      feedMode: 'symbol',
      symbol: tvSymbol,
      isTransparent: true,
      displayMode: 'compact',
      width: '100%',
      height: '100%',
      colorTheme: 'dark',
      locale: 'en',
    });
    wrapper.appendChild(script);
    container.appendChild(wrapper);

    return () => { container.innerHTML = ''; };
  }, [tvSymbol]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ── Brief Strip ───────────────────────────────────────────────────────────────

interface QuoteMap { [symbol: string]: { price: number; changePercent: number } }

function BriefStrip({ quoteMap }: { quoteMap: QuoteMap }) {
  const entries = Object.entries(quoteMap).filter(([, q]) => q.price > 0);
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b[1].changePercent - a[1].changePercent);
  const topGainers = sorted.slice(0, 3);
  const topLosers  = sorted.slice(-3).reverse();
  const greenCount = entries.filter(([, q]) => q.changePercent > 0).length;
  const redCount   = entries.filter(([, q]) => q.changePercent < 0).length;

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 mb-4 text-xs">
      <span className="text-white/40 font-medium uppercase tracking-wider flex-shrink-0">Today</span>

      <div className="flex items-center gap-1 text-white/30">
        <span className="text-gain font-semibold">{greenCount}▲</span>
        <span>/</span>
        <span className="text-loss font-semibold">{redCount}▼</span>
      </div>

      <div className="w-px h-4 bg-white/10 flex-shrink-0" />

      <div className="flex items-center gap-2">
        <span className="text-white/30">Top gainers:</span>
        {topGainers.map(([sym, q]) => (
          <span key={sym} className="text-gain font-mono font-semibold">
            {sym} {formatPercent(q.changePercent)}
          </span>
        ))}
      </div>

      <div className="w-px h-4 bg-white/10 flex-shrink-0" />

      <div className="flex items-center gap-2">
        <span className="text-white/30">Biggest drops:</span>
        {topLosers.map(([sym, q]) => (
          <span key={sym} className="text-loss font-mono font-semibold">
            {sym} {formatPercent(q.changePercent)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function XtbWatchlistTab() {
  const [selected, setSelected] = useState<XtbStock>(XTB_STOCKS[0]);
  const [sortMode, setSortMode] = useState<'change' | 'alpha'>('change');
  const [filterSector, setFilterSector] = useState<string>('All');

  // Fetch prices for FMP-compatible stocks only
  const fmpSymbols = useMemo(
    () => XTB_STOCKS.filter(s => !s.skipFmp).map(s => s.symbol),
    []
  );

  // intervalMs=0: we let useScheduledRefresh drive all subsequent refreshes
  const { data: quotes, loading, refetch } = usePolling(
    () => fetchWatchlistQuotes(fmpSymbols),
    0,
    [fmpSymbols.join(',')]
  );

  // Scheduled + manual refresh controller
  const { lastRefresh, config, setConfig, manualRefresh } = useScheduledRefresh(
    refetch,
    'xtb-refresh-config'
  );

  // Build a quick lookup map
  const quoteMap: QuoteMap = useMemo(() => {
    if (!quotes) return {};
    return Object.fromEntries(quotes.map(q => [q.symbol, { price: q.price, changePercent: q.changePercent }]));
  }, [quotes]);

  // Build sorted + filtered stock list
  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(XTB_STOCKS.map(s => s.sector)))],
    []
  );

  const displayList = useMemo(() => {
    let list = XTB_STOCKS;
    if (filterSector !== 'All') list = list.filter(s => s.sector === filterSector);

    return [...list].sort((a, b) => {
      if (sortMode === 'alpha') return a.symbol.localeCompare(b.symbol);
      const aPct = quoteMap[a.symbol]?.changePercent ?? 0;
      const bPct = quoteMap[b.symbol]?.changePercent ?? 0;
      return bPct - aPct;
    });
  }, [sortMode, filterSector, quoteMap]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Refresh controls header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-800 border border-white/5">
        {/* Left: title + timestamps */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <span>📊</span> XTB Watchlist — Daily Brief
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/25">
            <span>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            {lastRefresh && (
              <>
                <span className="text-white/10">•</span>
                <span>
                  Last refresh:{' '}
                  {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: interval selector + manual refresh */}
        <div className="flex items-center gap-2">
          <select
            value={config.mode}
            onChange={(e) =>
              setConfig({ ...config, mode: e.target.value as typeof config.mode })
            }
            className="text-xs bg-white/5 border border-white/10 text-white/60 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:border-accent/40 hover:bg-white/10 transition-colors"
          >
            {REFRESH_OPTIONS.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={manualRefresh}
            disabled={loading}
            title="Refresh now"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/15 hover:bg-accent/25 border border-accent/20 text-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              className={`text-base leading-none select-none ${loading ? 'animate-spin' : ''}`}
              aria-hidden
            >
              ↻
            </span>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Daily brief strip */}
      <BriefStrip quoteMap={quoteMap} />

      {/* Main two-panel layout */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: '680px' }}>

        {/* ── Left: Stock List ── */}
        <div className="col-span-12 lg:col-span-4 flex flex-col bg-surface-800 rounded-xl border border-white/5 overflow-hidden">
          {/* List header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <span>⭐</span> XTB Watchlist
              <span className="text-white/30 font-normal">({displayList.length})</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortMode('change')}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${sortMode === 'change' ? 'bg-accent/20 text-accent' : 'text-white/40 hover:text-white/60'}`}
              >
                % Chg
              </button>
              <button
                onClick={() => setSortMode('alpha')}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${sortMode === 'alpha' ? 'bg-accent/20 text-accent' : 'text-white/40 hover:text-white/60'}`}
              >
                A–Z
              </button>
            </div>
          </div>

          {/* Sector filter pills */}
          <div className="flex gap-1 flex-wrap px-3 py-2 border-b border-white/5 flex-shrink-0">
            {sectors.slice(0, 8).map(sec => (
              <button
                key={sec}
                onClick={() => setFilterSector(sec)}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${
                  filterSector === sec
                    ? 'bg-accent/25 text-accent font-semibold'
                    : 'text-white/30 hover:text-white/50 bg-white/[0.03]'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Column headers */}
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/5 flex-shrink-0">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Symbol / Name</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/25 uppercase tracking-wider w-16 text-right">Price</span>
              <span className="text-[10px] text-white/25 uppercase tracking-wider w-14 text-right">Change</span>
            </div>
          </div>

          {/* Stock rows */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4"><SkeletonRows rows={8} /></div>
            ) : (
              displayList.map((stock) => {
                const q = quoteMap[stock.symbol];
                const isSelected = selected.symbol === stock.symbol;
                const pct = q?.changePercent ?? null;

                return (
                  <button
                    key={stock.symbol}
                    onClick={() => setSelected(stock)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors border-b border-white/[0.03] text-left group ${
                      isSelected
                        ? 'bg-accent/10 border-l-2 border-l-accent'
                        : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-white font-semibold text-xs w-10 flex-shrink-0">{stock.symbol}</span>
                      <div className="min-w-0">
                        <div className="text-white/40 text-[10px] truncate leading-tight">{stock.name}</div>
                        <span className={`text-[10px] px-1.5 py-0 rounded-full leading-tight ${SECTOR_BADGE[stock.sector] ?? 'text-white/20 bg-white/5'}`}>
                          {stock.sector}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-white/60 font-mono text-xs w-16 text-right">
                        {q?.price ? `$${formatPrice(q.price)}` : '—'}
                      </span>
                      <span className={`font-mono text-xs font-semibold w-14 text-right ${pct !== null ? changeColor(pct) : 'text-white/20'}`}>
                        {pct !== null ? formatPercent(pct) : '—'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Chart + News ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">

          {/* Selected stock header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg">{selected.symbol}</span>
              <span className="text-white/50 text-sm">{selected.name}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${SECTOR_BADGE[selected.sector] ?? 'text-white/30 bg-white/5'}`}>
                {selected.sector}
              </span>
            </div>
            {quoteMap[selected.symbol] && (
              <div className="flex items-center gap-3">
                <span className="text-white font-mono text-base">
                  ${formatPrice(quoteMap[selected.symbol].price)}
                </span>
                <span className={`font-mono text-sm font-bold ${changeColor(quoteMap[selected.symbol].changePercent)}`}>
                  {formatPercent(quoteMap[selected.symbol].changePercent)}
                </span>
              </div>
            )}
          </div>

          {/* TradingView Chart */}
          <div className="bg-surface-800 rounded-xl border border-white/5 overflow-hidden" style={{ height: '370px' }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white/70 flex items-center gap-2">
                <span>📈</span> Chart Analysis
              </h3>
              <span className="text-xs text-accent/60 font-mono">{selected.tv}</span>
            </div>
            <div className="h-[calc(100%-40px)]">
              <TvChart key={selected.tv} tvSymbol={selected.tv} />
            </div>
          </div>

          {/* TradingView Timeline (news) */}
          <div className="bg-surface-800 rounded-xl border border-white/5 overflow-hidden flex-1" style={{ minHeight: '270px' }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white/70 flex items-center gap-2">
                <span>📰</span> Latest News — {selected.symbol}
              </h3>
              <a
                href={`https://www.tradingview.com/symbols/${selected.tv.replace(':', '-')}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-accent/50 hover:text-accent/80 transition-colors"
              >
                View on TradingView ↗
              </a>
            </div>
            <div className="h-[calc(100%-40px)]">
              <TvTimeline key={selected.tv} tvSymbol={selected.tv} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
