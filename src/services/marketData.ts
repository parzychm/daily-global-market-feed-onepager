import type {
  TickerItem,
  MarketSummary,
  NewsItem,
  HeatmapItem,
  StandoutStock,
  SectorPerformance,
  MoverStock,
  WatchlistItem,
  CryptoAsset,
  BondETF,
  PredictionMarket,
} from '../types';

// ── Cache layer ──

const cache = new Map<string, { data: unknown; ts: number }>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

// ── FMP (Financial Modeling Prep) fetcher ──

const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

function getFmpKey(): string {
  // Priority: localStorage > env var > demo
  try {
    const stored = localStorage.getItem('dgmf-fmp-api-key');
    if (stored && stored.trim()) return stored.trim();
  } catch { /* SSR safety */ }
  return import.meta.env.VITE_FMP_API_KEY || 'demo';
}

export function isUsingDemoKey(): boolean {
  return getFmpKey() === 'demo';
}

async function fmpFetch<T>(path: string): Promise<T> {
  const key = getFmpKey();
  const sep = path.includes('?') ? '&' : '?';
  const url = `${FMP_BASE}${path}${sep}apikey=${key}`;
  const cached = getCached<T>(url, 60_000);
  if (cached) return cached;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FMP ${res.status}`);
    const data = await res.json();
    setCache(url, data);
    return data as T;
  } catch (err) {
    console.warn(`FMP fetch failed for ${path}:`, err);
    throw err;
  }
}

// ── Public API functions ──

export async function fetchTickerData(symbols: string[]): Promise<TickerItem[]> {
  // FMP demo key only works for a few symbols. Try live API first,
  // then fall back to realistic mock data so the ticker always shows content.
  try {
    // Separate equity/ETF symbols from forex pairs
    const fxSymbols = symbols.filter(s => /^[A-Z]{6}$/.test(s) && (s.endsWith('USD') || s.startsWith('USD') || s.endsWith('JPY') || s.endsWith('CNY') || s.endsWith('CHF')));
    const equitySymbols = symbols.filter(s => !fxSymbols.includes(s));

    const results: TickerItem[] = [];

    // Fetch equities/ETFs
    if (equitySymbols.length > 0) {
      const data = await fmpFetch<Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        changesPercentage: number;
      }>>(`/quote/${equitySymbols.join(',')}`);
      if (Array.isArray(data)) {
        results.push(...data.map((d) => ({
          symbol: d.symbol,
          name: d.name || d.symbol,
          price: d.price,
          change: d.change,
          changePercent: d.changesPercentage,
        })));
      }
    }

    // Fetch forex pairs
    if (fxSymbols.length > 0) {
      for (const fx of fxSymbols) {
        try {
          const pair = `${fx.slice(0,3)}/${fx.slice(3)}`;
          const fxData = await fmpFetch<Array<{
            ticker: string;
            bid: number;
            changes: number;
          }>>(`/fx/${pair}`);
          if (Array.isArray(fxData) && fxData.length > 0) {
            results.push({
              symbol: fx,
              name: pair,
              price: fxData[0].bid,
              change: fxData[0].changes,
              changePercent: fxData[0].bid > 0 ? (fxData[0].changes / fxData[0].bid) * 100 : 0,
            });
          }
        } catch { /* skip individual fx failures */ }
      }
    }

    // If we got at least some results, merge with mock for missing symbols
    if (results.length > 0) {
      const fetched = new Set(results.map(r => r.symbol));
      const missing = symbols.filter(s => !fetched.has(s));
      if (missing.length > 0) {
        const mocks = getMockTicker();
        for (const sym of missing) {
          const mock = mocks.find(m => m.symbol === sym);
          if (mock) results.push(mock);
        }
      }
      // Return in original symbol order
      return symbols.map(s => results.find(r => r.symbol === s)!).filter(Boolean);
    }

    throw new Error('No data returned');
  } catch {
    // Full fallback to mock data
    return getMockTicker().filter(m => symbols.includes(m.symbol));
  }
}

export async function fetchMarketSummary(): Promise<MarketSummary> {
  // In production, this would call an AI API or a pre-computed summary endpoint
  return {
    headline: 'U.S.-Iran Ceasefire Sparks Broad Market Relief Rally',
    body: `President Trump announced a two-week ceasefire with Iran just 90 minutes before his self-imposed deadline, sending Wall Street surging with the Dow Jones up ~1,200 points (2.85%), the S&P 500 gaining 2.51%, and the Nasdaq climbing 2.80%.

The deal, brokered with Pakistan's help, is contingent on Iran reopening the Strait of Hormuz, easing fears of a prolonged energy shock. Crude oil posted one of its worst single-day drops — WTI fell ~16% to around $95, Brent dropped ~14% to just above $94.

Bitcoin crossed $71,000 as risk-on sentiment surged. The U.S. dollar weakened sharply as safe-haven demand evaporated. Gold rallied initially but then stalled as inflation fears eased with the oil drop.`,
    sentiment: 'Bullish',
    updatedAt: new Date().toISOString(),
    sources: ['Reuters', 'Bloomberg', 'CNBC', 'FT'],
  };
}

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const data = await fmpFetch<Array<{
      title: string;
      text: string;
      url: string;
      site: string;
      publishedDate: string;
      image: string;
    }>>('/stock_news?limit=8');
    return data.map((d, i) => ({
      id: `news-${i}`,
      title: d.title,
      summary: d.text?.substring(0, 200) + '...',
      url: d.url,
      source: d.site,
      publishedAt: d.publishedDate,
      imageUrl: d.image,
    }));
  } catch {
    return getMockNews();
  }
}

export async function fetchHeatmapData(): Promise<HeatmapItem[]> {
  try {
    const data = await fmpFetch<Array<{
      symbol: string;
      companyName: string;
      sector: string;
      marketCap: number;
      changesPercentage: number;
    }>>('/stock-screener?marketCapMoreThan=50000000000&limit=50&exchange=NYSE,NASDAQ');
    return data.map((d) => ({
      symbol: d.symbol,
      name: d.companyName,
      sector: d.sector || 'Other',
      marketCap: d.marketCap,
      changePercent: d.changesPercentage,
    }));
  } catch {
    return getMockHeatmap();
  }
}

export async function fetchStandouts(): Promise<StandoutStock[]> {
  try {
    const gainers = await fmpFetch<Array<{
      symbol: string;
      name: string;
      exchange: string;
      price: number;
      changesPercentage: number;
      change: number;
    }>>('/stock_market/gainers?limit=4');
    return gainers.map((d) => ({
      symbol: d.symbol,
      name: d.name,
      exchange: d.exchange,
      price: d.price,
      changePercent: d.changesPercentage,
      prevClose: d.price - d.change,
      volume: 0,
      marketCap: 0,
      peRatio: 0,
      dividendYield: 0,
      explanation: `${d.name} surged ${d.changesPercentage.toFixed(1)}% amid broad market optimism and sector rotation.`,
    }));
  } catch {
    return getMockStandouts();
  }
}

export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
  try {
    const data = await fmpFetch<Array<{
      sector: string;
      changesPercentage: string;
    }>>('/sector-performance');
    return data.map((d) => ({
      name: d.sector,
      symbol: '',
      price: 0,
      changePercent: parseFloat(d.changesPercentage),
    }));
  } catch {
    return getMockSectors();
  }
}

export async function fetchGainersLosers(): Promise<{
  gainers: MoverStock[];
  losers: MoverStock[];
  active: MoverStock[];
}> {
  try {
    const [gainers, losers, active] = await Promise.all([
      fmpFetch<Array<{ symbol: string; name: string; price: number; change: number; changesPercentage: number }>>('/stock_market/gainers?limit=5'),
      fmpFetch<Array<{ symbol: string; name: string; price: number; change: number; changesPercentage: number }>>('/stock_market/losers?limit=5'),
      fmpFetch<Array<{ symbol: string; name: string; price: number; change: number; changesPercentage: number }>>('/stock_market/actives?limit=5'),
    ]);
    const map = (d: { symbol: string; name: string; price: number; change: number; changesPercentage: number }) => ({
      symbol: d.symbol,
      name: d.name,
      price: d.price,
      change: d.change,
      changePercent: d.changesPercentage,
    });
    return {
      gainers: gainers.map(map),
      losers: losers.map(map),
      active: active.map(map),
    };
  } catch {
    return { gainers: [], losers: [], active: [] };
  }
}

export async function fetchWatchlistQuotes(symbols: string[]): Promise<WatchlistItem[]> {
  if (symbols.length === 0) return [];
  try {
    const data = await fmpFetch<Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changesPercentage: number;
    }>>(`/quote/${symbols.join(',')}`);
    return data.map((d) => ({
      symbol: d.symbol,
      name: d.name || d.symbol,
      price: d.price,
      change: d.change,
      changePercent: d.changesPercentage,
      sparkline: generateSparkline(d.price, d.changesPercentage),
    }));
  } catch {
    return symbols.map((s) => ({
      symbol: s,
      name: s,
      price: 0,
      change: 0,
      changePercent: 0,
      sparkline: [],
    }));
  }
}

export async function fetchCrypto(): Promise<CryptoAsset[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple,dogecoin,cardano&sparkline=false'
    );
    const data = await res.json();
    return data.map((d: {
      id: string;
      symbol: string;
      name: string;
      current_price: number;
      price_change_percentage_24h: number;
      market_cap: number;
      image: string;
    }) => ({
      id: d.id,
      symbol: d.symbol.toUpperCase(),
      name: d.name,
      price: d.current_price,
      changePercent: d.price_change_percentage_24h,
      marketCap: d.market_cap,
      imageUrl: d.image,
    }));
  } catch {
    return getMockCrypto();
  }
}

export async function fetchBondETFs(): Promise<BondETF[]> {
  try {
    const symbols = 'TIP,GOVT,MUB,CWB,HYG,LQD';
    const data = await fmpFetch<Array<{
      symbol: string;
      name: string;
      price: number;
      changesPercentage: number;
    }>>(`/quote/${symbols}`);
    return data.map((d) => ({
      symbol: d.symbol,
      name: d.name || d.symbol,
      price: d.price,
      changePercent: d.changesPercentage,
    }));
  } catch {
    return getMockBonds();
  }
}

export async function fetchPredictions(): Promise<PredictionMarket[]> {
  // Polymarket API doesn't have a simple public REST endpoint for browsing,
  // so we return curated predictions here. In production, you'd use their API.
  return getMockPredictions();
}

// ── Helpers ──

function generateSparkline(price: number, changePct: number): number[] {
  const points = 20;
  const result: number[] = [];
  const startPrice = price / (1 + changePct / 100);
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const noise = (Math.random() - 0.5) * price * 0.01;
    result.push(startPrice + (price - startPrice) * progress + noise);
  }
  return result;
}

// ── Mock data for demo / fallback ──

function getMockTicker(): TickerItem[] {
  // Prices as of April 8-9, 2026 — US-Iran ceasefire rally, oil crash
  return [
    // US — SPY/QQQ/DIA are ETF prices, not index points
    { symbol: 'SPY', name: 'S&P 500', price: 565.42, change: 13.82, changePercent: 2.51 },
    { symbol: 'QQQ', name: 'NASDAQ 100', price: 487.65, change: 13.70, changePercent: 2.89 },
    { symbol: 'DIA', name: 'Dow Jones', price: 424.18, change: 11.74, changePercent: 2.85 },
    { symbol: 'VIX', name: 'VIX', price: 21.04, change: -4.74, changePercent: -18.39 },
    { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0965, change: 0.0048, changePercent: 0.44 },
    { symbol: 'GBPUSD', name: 'GBP/USD', price: 1.2892, change: 0.0035, changePercent: 0.27 },
    { symbol: 'USDJPY', name: 'USD/JPY', price: 146.85, change: -1.32, changePercent: -0.89 },
    { symbol: 'USDCNY', name: 'USD/CNY', price: 7.2715, change: -0.018, changePercent: -0.25 },
    { symbol: 'GLD', name: 'Gold', price: 296.40, change: -2.85, changePercent: -0.95 },
    { symbol: 'USO', name: 'Crude Oil', price: 66.82, change: -10.45, changePercent: -13.53 },
    { symbol: 'TLT', name: 'US 20Y Bond', price: 89.52, change: 0.82, changePercent: 0.92 },
    // EU
    { symbol: 'EZU', name: 'Euro Stoxx', price: 54.38, change: 1.24, changePercent: 2.33 },
    { symbol: 'EWG', name: 'DAX (Germany)', price: 35.92, change: 0.97, changePercent: 2.78 },
    { symbol: 'EWQ', name: 'CAC 40 (France)', price: 39.85, change: 0.78, changePercent: 2.00 },
    { symbol: 'EWU', name: 'FTSE (UK)', price: 37.62, change: 0.58, changePercent: 1.57 },
    // ASIA
    { symbol: 'EWJ', name: 'Nikkei (Japan)', price: 71.25, change: 1.52, changePercent: 2.18 },
    { symbol: 'FXI', name: 'China Large Cap', price: 29.84, change: 0.51, changePercent: 1.74 },
    { symbol: 'EWY', name: 'KOSPI (Korea)', price: 64.78, change: 1.90, changePercent: 3.02 },
    { symbol: 'INDA', name: 'Nifty (India)', price: 52.45, change: 0.72, changePercent: 1.39 },
  ];
}

function getMockNews(): NewsItem[] {
  return [
    { id: '1', title: 'Markets Rally on Trade Deal Progress', summary: 'Global equities surged as negotiators made progress on trade agreements...', url: '#', source: 'Reuters', publishedAt: new Date(Date.now() - 7 * 60000).toISOString() },
    { id: '2', title: 'Oil Prices Drop Sharply on Supply News', summary: 'Crude futures fell as supply concerns eased following policy announcements...', url: '#', source: 'Bloomberg', publishedAt: new Date(Date.now() - 120 * 60000).toISOString() },
    { id: '3', title: 'Tech Sector Leads Market Recovery', summary: 'Technology stocks outperformed as investors rotated into growth names...', url: '#', source: 'CNBC', publishedAt: new Date(Date.now() - 180 * 60000).toISOString() },
    { id: '4', title: 'Fed Officials Signal Rate Path', summary: 'Federal Reserve governors provided updated guidance on monetary policy trajectory...', url: '#', source: 'FT', publishedAt: new Date(Date.now() - 300 * 60000).toISOString() },
    { id: '5', title: 'European Markets Follow US Rally', summary: 'STOXX 600 gained ground as positive sentiment from Wall Street spread globally...', url: '#', source: 'Reuters', publishedAt: new Date(Date.now() - 480 * 60000).toISOString() },
  ];
}

function getMockHeatmap(): HeatmapItem[] {
  // Based on Perplexity Finance April 8-9, 2026 — ceasefire rally
  const stocks = [
    { symbol: 'AAPL', name: 'Apple', sector: 'Technology', marketCap: 3450e9, changePercent: 2.13 },
    { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', marketCap: 3250e9, changePercent: 0.55 },
    { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', marketCap: 2900e9, changePercent: 2.23 },
    { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology', marketCap: 2200e9, changePercent: 3.88 },
    { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer Cyclical', marketCap: 2100e9, changePercent: 3.50 },
    { symbol: 'META', name: 'Meta', sector: 'Technology', marketCap: 1580e9, changePercent: 6.50 },
    { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer Cyclical', marketCap: 730e9, changePercent: -0.98 },
    { symbol: 'BRK-B', name: 'Berkshire', sector: 'Financials', marketCap: 950e9, changePercent: 0.38 },
    { symbol: 'JPM', name: 'JPMorgan', sector: 'Financials', marketCap: 650e9, changePercent: 3.55 },
    { symbol: 'V', name: 'Visa', sector: 'Financials', marketCap: 570e9, changePercent: 2.12 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 420e9, changePercent: 0.85 },
    { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', marketCap: 480e9, changePercent: 1.32 },
    { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', marketCap: 480e9, changePercent: -4.85 },
    { symbol: 'CVX', name: 'Chevron', sector: 'Energy', marketCap: 290e9, changePercent: -3.92 },
    { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Cyclical', marketCap: 335e9, changePercent: 5.46 },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Defensive', marketCap: 395e9, changePercent: 0.72 },
    { symbol: 'MA', name: 'Mastercard', sector: 'Financials', marketCap: 415e9, changePercent: 1.77 },
    { symbol: 'AVGO', name: 'Broadcom', sector: 'Technology', marketCap: 640e9, changePercent: 4.99 },
    { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', marketCap: 720e9, changePercent: 1.45 },
    { symbol: 'COST', name: 'Costco', sector: 'Consumer Defensive', marketCap: 310e9, changePercent: 2.15 },
    { symbol: 'NFLX', name: 'Netflix', sector: 'Technology', marketCap: 295e9, changePercent: 0.58 },
    { symbol: 'AMD', name: 'AMD', sector: 'Technology', marketCap: 235e9, changePercent: 4.64 },
    { symbol: 'CRM', name: 'Salesforce', sector: 'Technology', marketCap: 270e9, changePercent: 1.38 },
    { symbol: 'INTC', name: 'Intel', sector: 'Technology', marketCap: 108e9, changePercent: 11.42 },
    { symbol: 'WMT', name: 'Walmart', sector: 'Consumer Defensive', marketCap: 520e9, changePercent: 1.15 },
    { symbol: 'BAC', name: 'Bank of America', sector: 'Financials', marketCap: 315e9, changePercent: 3.18 },
    { symbol: 'DIS', name: 'Disney', sector: 'Communication', marketCap: 215e9, changePercent: 2.74 },
    { symbol: 'CSCO', name: 'Cisco', sector: 'Technology', marketCap: 210e9, changePercent: 3.74 },
    { symbol: 'PLTR', name: 'Palantir', sector: 'Technology', marketCap: 155e9, changePercent: -6.20 },
    { symbol: 'UBER', name: 'Uber', sector: 'Technology', marketCap: 168e9, changePercent: 2.08 },
    { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials', marketCap: 188e9, changePercent: 3.12 },
    { symbol: 'MU', name: 'Micron', sector: 'Technology', marketCap: 105e9, changePercent: 7.72 },
    { symbol: 'LRCX', name: 'Lam Research', sector: 'Technology', marketCap: 98e9, changePercent: 9.87 },
    { symbol: 'AMAT', name: 'Applied Materials', sector: 'Technology', marketCap: 140e9, changePercent: 8.87 },
  ];
  return stocks;
}

function getMockStandouts(): StandoutStock[] {
  // Perplexity Finance Standouts — April 8, 2026
  return [
    { symbol: 'AMCR', name: 'Amcor plc', exchange: 'NYSE', price: 42.37, changePercent: 8.53, prevClose: 39.04, volume: 4_330_000, marketCap: 19.58e9, peRatio: 31.86, dividendYield: 6.08, explanation: 'AMCR surged alongside a broad market rally driven by the US-Iran ceasefire, sparking strong risk-on sentiment across global equities.' },
    { symbol: 'SHW', name: 'The Sherwin-Williams Company', exchange: 'NYSE', price: 335.67, changePercent: 6.91, prevClose: 313.96, volume: 1_650_000, marketCap: 83.17e9, peRatio: 32.68, dividendYield: 0.94, explanation: 'Sherwin-Williams surged as oil prices crashed, boosting economically sensitive housing and construction-related stocks.' },
    { symbol: 'PPG', name: 'PPG Industries, Inc.', exchange: 'NYSE', price: 110.47, changePercent: 8.05, prevClose: 102.24, volume: 2_570_000, marketCap: 24.69e9, peRatio: 15.96, dividendYield: 2.54, explanation: 'PPG Industries surged as a major acquisition in the building products sector sparked broad optimism for coatings and materials.' },
    { symbol: 'HD', name: 'The Home Depot, Inc.', exchange: 'NYSE', price: 336.16, changePercent: 5.46, prevClose: 318.77, volume: 3_700_000, marketCap: 334.82e9, peRatio: 23.61, dividendYield: 2.75, explanation: 'Home Depot shares surged as the US-Iran ceasefire led to oil prices plummeting, sparking a rally in construction and home improvement stocks.' },
  ];
}

function getMockSectors(): SectorPerformance[] {
  // Perplexity Finance — April 8, 2026
  return [
    { name: 'Technology', symbol: 'XLK', price: 141.69, changePercent: 3.10 },
    { name: 'Energy', symbol: 'XLE', price: 58.05, changePercent: 3.51 },
    { name: 'Consumer Cyclical', symbol: 'XLY', price: 110.82, changePercent: 2.83 },
    { name: 'Consumer Defensive', symbol: 'XLP', price: 82.78, changePercent: 1.87 },
    { name: 'Communication', symbol: 'XLC', price: 113.81, changePercent: 1.78 },
    { name: 'Industrials', symbol: 'XLI', price: 170.44, changePercent: 3.75 },
    { name: 'Financial Services', symbol: 'XLF', price: 51.20, changePercent: 2.65 },
    { name: 'Utilities', symbol: 'XLU', price: 46.78, changePercent: 1.10 },
    { name: 'Basic Materials', symbol: 'XLB', price: 51.75, changePercent: 3.33 },
    { name: 'Real Estate', symbol: 'XLRE', price: 42.44, changePercent: 1.73 },
    { name: 'Healthcare', symbol: 'XLV', price: 140.20, changePercent: 1.55 },
  ];
}

function getMockCrypto(): CryptoAsset[] {
  return [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 71638.98, changePercent: 2.84, marketCap: 1.4e12, imageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 2218.64, changePercent: 3.99, marketCap: 267e9, imageUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', price: 83.38, changePercent: 1.09, marketCap: 38e9, imageUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 1.36, changePercent: 1.89, marketCap: 70e9, imageUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.112, changePercent: 4.2, marketCap: 16e9, imageUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.42, changePercent: -0.8, marketCap: 15e9, imageUrl: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  ];
}

function getMockBonds(): BondETF[] {
  return [
    { symbol: 'TIP', name: 'T.I.P.S.', price: 110.91, changePercent: 0.02 },
    { symbol: 'GOVT', name: 'U.S. Treasuries', price: 22.91, changePercent: 0.24 },
    { symbol: 'MUB', name: 'Municipals', price: 106.76, changePercent: 0.18 },
    { symbol: 'CWB', name: 'Convertibles', price: 96.39, changePercent: 2.72 },
    { symbol: 'HYG', name: 'High Yield', price: 80.19, changePercent: 0.59 },
    { symbol: 'LQD', name: 'High Grade', price: 109.49, changePercent: 0.39 },
  ];
}

function getMockPredictions(): PredictionMarket[] {
  return [
    {
      id: '1',
      question: 'What will WTI Crude Oil hit in April 2026?',
      options: [
        { label: '↓ $90', probability: 79, change: 21.0 },
        { label: '↓ $80', probability: 38, change: 5.5 },
        { label: '↑ $120', probability: 34, change: -18.0 },
      ],
      volume: '$18M',
      source: 'Polymarket',
    },
    {
      id: '2',
      question: 'How many Fed rate cuts in 2026?',
      options: [
        { label: '0 (0 bps)', probability: 31, change: 10.6 },
        { label: '1 (25 bps)', probability: 26, change: 0.0 },
        { label: '2 (50 bps)', probability: 20, change: 4.0 },
      ],
      volume: '$17M',
      source: 'Polymarket',
    },
    {
      id: '3',
      question: 'Largest Company end of April?',
      options: [
        { label: 'NVIDIA', probability: 98, change: 0.2 },
        { label: 'Alphabet', probability: 1, change: 0.3 },
        { label: 'Apple', probability: 1, change: -0.1 },
      ],
      volume: '$3.9M',
      source: 'Polymarket',
    },
  ];
}
