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
const FMP_KEY = 'demo'; // Replace with your key

async function fmpFetch<T>(path: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${FMP_BASE}${path}${sep}apikey=${FMP_KEY}`;
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
    headline: 'Markets Rally on Geopolitical Breakthrough',
    body: `Global markets surged broadly as investors reacted to significant developments in international trade negotiations and geopolitical de-escalation. 
    
The S&P 500 and Nasdaq posted strong gains, led by technology and industrials sectors. Energy prices saw sharp moves as supply dynamics shifted, while safe-haven assets adjusted to the improved risk sentiment.

Key drivers include monetary policy expectations, corporate earnings momentum, and shifting commodity supply patterns. Volatility indices retreated from recent highs as market participants recalibrated risk assessments.`,
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
  return [
    // US
    { symbol: 'SPY', name: 'S&P 500', price: 5823.75, change: 142.50, changePercent: 2.51 },
    { symbol: 'QQQ', name: 'NASDAQ 100', price: 502.38, change: 14.12, changePercent: 2.89 },
    { symbol: 'DIA', name: 'Dow Jones', price: 421.44, change: 11.67, changePercent: 2.85 },
    { symbol: 'VIX', name: 'VIX', price: 21.04, change: -4.74, changePercent: -18.39 },
    { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0842, change: -0.0032, changePercent: -0.30 },
    { symbol: 'GBPUSD', name: 'GBP/USD', price: 1.2735, change: 0.0018, changePercent: 0.14 },
    { symbol: 'USDJPY', name: 'USD/JPY', price: 151.42, change: 0.38, changePercent: 0.25 },
    { symbol: 'USDCNY', name: 'USD/CNY', price: 7.2480, change: -0.012, changePercent: -0.17 },
    { symbol: 'GLD', name: 'Gold', price: 302.15, change: 2.40, changePercent: 0.80 },
    { symbol: 'USO', name: 'Crude Oil', price: 72.40, change: -8.92, changePercent: -10.97 },
    { symbol: 'TLT', name: 'US 20Y Bond', price: 92.35, change: 0.67, changePercent: 0.73 },
    // EU
    { symbol: 'EZU', name: 'Euro Stoxx', price: 52.80, change: 1.12, changePercent: 2.17 },
    { symbol: 'EWG', name: 'DAX (Germany)', price: 34.65, change: 0.89, changePercent: 2.64 },
    { symbol: 'EWQ', name: 'CAC 40 (France)', price: 38.20, change: 0.72, changePercent: 1.92 },
    { symbol: 'EWU', name: 'FTSE (UK)', price: 36.45, change: 0.54, changePercent: 1.50 },
    // ASIA
    { symbol: 'EWJ', name: 'Nikkei (Japan)', price: 68.90, change: 1.34, changePercent: 1.98 },
    { symbol: 'FXI', name: 'China Large Cap', price: 28.45, change: 0.42, changePercent: 1.50 },
    { symbol: 'EWY', name: 'KOSPI (Korea)', price: 62.30, change: 1.85, changePercent: 3.06 },
    { symbol: 'INDA', name: 'Nifty (India)', price: 51.20, change: 0.68, changePercent: 1.35 },
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
  const stocks = [
    { symbol: 'AAPL', name: 'Apple', sector: 'Technology', marketCap: 3200e9, changePercent: 2.1 },
    { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', marketCap: 3100e9, changePercent: 0.6 },
    { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', marketCap: 2800e9, changePercent: 2.2 },
    { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology', marketCap: 2100e9, changePercent: 3.9 },
    { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer Cyclical', marketCap: 2000e9, changePercent: 3.5 },
    { symbol: 'META', name: 'Meta', sector: 'Technology', marketCap: 1500e9, changePercent: 6.5 },
    { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer Cyclical', marketCap: 700e9, changePercent: -1.0 },
    { symbol: 'BRK-B', name: 'Berkshire', sector: 'Financials', marketCap: 900e9, changePercent: 0.4 },
    { symbol: 'JPM', name: 'JPMorgan', sector: 'Financials', marketCap: 600e9, changePercent: 3.6 },
    { symbol: 'V', name: 'Visa', sector: 'Financials', marketCap: 550e9, changePercent: 1.8 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 400e9, changePercent: 0.9 },
    { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', marketCap: 450e9, changePercent: 1.2 },
    { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', marketCap: 500e9, changePercent: -2.1 },
    { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Cyclical', marketCap: 335e9, changePercent: 5.5 },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Defensive', marketCap: 380e9, changePercent: 0.7 },
    { symbol: 'MA', name: 'Mastercard', sector: 'Financials', marketCap: 400e9, changePercent: 1.8 },
    { symbol: 'AVGO', name: 'Broadcom', sector: 'Technology', marketCap: 600e9, changePercent: 5.0 },
    { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', marketCap: 700e9, changePercent: 1.5 },
    { symbol: 'COST', name: 'Costco', sector: 'Consumer Defensive', marketCap: 300e9, changePercent: 2.3 },
    { symbol: 'NFLX', name: 'Netflix', sector: 'Technology', marketCap: 280e9, changePercent: 0.6 },
    { symbol: 'AMD', name: 'AMD', sector: 'Technology', marketCap: 220e9, changePercent: 4.6 },
    { symbol: 'CRM', name: 'Salesforce', sector: 'Technology', marketCap: 260e9, changePercent: 1.4 },
    { symbol: 'INTC', name: 'Intel', sector: 'Technology', marketCap: 100e9, changePercent: 11.4 },
    { symbol: 'WMT', name: 'Walmart', sector: 'Consumer Defensive', marketCap: 500e9, changePercent: 1.1 },
    { symbol: 'BAC', name: 'Bank of America', sector: 'Financials', marketCap: 300e9, changePercent: 3.2 },
    { symbol: 'DIS', name: 'Disney', sector: 'Communication', marketCap: 200e9, changePercent: 2.8 },
    { symbol: 'CSCO', name: 'Cisco', sector: 'Technology', marketCap: 200e9, changePercent: 3.7 },
    { symbol: 'PLTR', name: 'Palantir', sector: 'Technology', marketCap: 150e9, changePercent: -6.2 },
    { symbol: 'UBER', name: 'Uber', sector: 'Technology', marketCap: 160e9, changePercent: 2.1 },
    { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials', marketCap: 180e9, changePercent: 3.0 },
  ];
  return stocks;
}

function getMockStandouts(): StandoutStock[] {
  return [
    { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', price: 24.50, changePercent: 11.4, prevClose: 22.00, volume: 95_000_000, marketCap: 100e9, peRatio: 18.5, dividendYield: 1.2, explanation: 'Intel surged on reports of a potential partnership deal and positive analyst revisions.' },
    { symbol: 'HD', name: 'The Home Depot', exchange: 'NYSE', price: 336.16, changePercent: 5.46, prevClose: 318.77, volume: 3_700_000, marketCap: 334.8e9, peRatio: 23.6, dividendYield: 2.75, explanation: 'Home Depot shares rallied as falling energy prices boosted consumer sentiment for home improvement spending.' },
    { symbol: 'META', name: 'Meta Platforms', exchange: 'NASDAQ', price: 612.42, changePercent: 6.50, prevClose: 575.04, volume: 18_000_000, marketCap: 1500e9, peRatio: 28.3, dividendYield: 0.35, explanation: 'Meta surged on strong ad revenue expectations and optimism around AI monetization efforts.' },
    { symbol: 'LRCX', name: 'Lam Research', exchange: 'NASDAQ', price: 78.50, changePercent: 9.87, prevClose: 71.44, volume: 4_200_000, marketCap: 95e9, peRatio: 25.1, dividendYield: 0.92, explanation: 'Lam Research jumped on semiconductor capex acceleration forecasts from multiple analysts.' },
  ];
}

function getMockSectors(): SectorPerformance[] {
  return [
    { name: 'Technology', symbol: 'XLK', price: 141.69, changePercent: 3.10 },
    { name: 'Energy', symbol: 'XLE', price: 58.05, changePercent: -3.51 },
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
