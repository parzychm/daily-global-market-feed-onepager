// ── Market Data Types ──

export type Region = 'US' | 'EU' | 'ASIA';
export type Theme = 'dark' | 'light';
export type Sentiment = 'Bullish' | 'Bearish' | 'Neutral';

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MarketSummary {
  headline: string;
  body: string;
  sentiment: Sentiment;
  updatedAt: string;
  sources: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface HeatmapItem {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  changePercent: number;
}

export interface StandoutStock {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  changePercent: number;
  prevClose: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  explanation: string;
}

export interface SectorPerformance {
  name: string;
  symbol: string;
  price: number;
  changePercent: number;
}

export interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface PredictionMarket {
  id: string;
  question: string;
  options: {
    label: string;
    probability: number;
    change: number;
  }[];
  volume: string;
  source: string;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number;
  imageUrl: string;
}

export interface BondETF {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

// ── Widget Configuration ──

export type WidgetId =
  | 'ticker'
  | 'summary'
  | 'tradingviewNews'
  | 'heatmap'
  | 'news'
  | 'standouts'
  | 'sectors'
  | 'movers'
  | 'watchlist'
  | 'tradingviewWatchlist'
  | 'predictions'
  | 'crypto'
  | 'fixedIncome'
  | 'tradingviewChart';

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  enabled: boolean;
  icon: string;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// ── Dashboard State ──

export interface DashboardState {
  theme: Theme;
  region: Region;
  widgets: WidgetConfig[];
  layouts: LayoutItem[];
  refreshInterval: number; // in seconds
  tradingViewSymbols: string[];
}
