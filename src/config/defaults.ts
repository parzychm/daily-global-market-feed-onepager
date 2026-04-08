import type { WidgetConfig, LayoutItem } from '../types';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'ticker', title: 'Top Assets Ticker', enabled: true, icon: '📈' },
  { id: 'summary', title: 'Market Summary', enabled: true, icon: '📊' },
  { id: 'tradingviewNews', title: 'TradingView News', enabled: true, icon: '📰' },
  { id: 'heatmap', title: 'S&P 500 Heatmap', enabled: true, icon: '🟩' },
  { id: 'tradingviewChart', title: 'TradingView Chart', enabled: true, icon: '📉' },
  { id: 'standouts', title: 'Standouts', enabled: true, icon: '⭐' },
  { id: 'sectors', title: 'Equity Sectors', enabled: true, icon: '🏢' },
  { id: 'movers', title: 'Gainers / Losers', enabled: true, icon: '🔄' },
  { id: 'tradingviewWatchlist', title: 'TradingView Watchlist', enabled: true, icon: '👁️' },
  { id: 'watchlist', title: 'Custom Watchlist', enabled: true, icon: '⭐' },
  { id: 'predictions', title: 'Prediction Markets', enabled: true, icon: '🔮' },
  { id: 'crypto', title: 'Cryptocurrencies', enabled: true, icon: '₿' },
  { id: 'fixedIncome', title: 'Fixed Income', enabled: true, icon: '🏦' },
];

export const DEFAULT_LAYOUTS: LayoutItem[] = [
  { i: 'ticker', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
  { i: 'summary', x: 0, y: 2, w: 8, h: 5, minW: 4, minH: 3 },
  { i: 'tradingviewNews', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 3 },
  { i: 'heatmap', x: 0, y: 7, w: 8, h: 7, minW: 4, minH: 4 },
  { i: 'tradingviewChart', x: 8, y: 7, w: 4, h: 7, minW: 3, minH: 4 },
  { i: 'standouts', x: 0, y: 14, w: 12, h: 5, minW: 4, minH: 3 },
  { i: 'sectors', x: 0, y: 19, w: 4, h: 5, minW: 3, minH: 3 },
  { i: 'movers', x: 4, y: 19, w: 4, h: 5, minW: 3, minH: 3 },
  { i: 'tradingviewWatchlist', x: 8, y: 19, w: 4, h: 5, minW: 3, minH: 3 },
  { i: 'watchlist', x: 0, y: 24, w: 4, h: 5, minW: 3, minH: 3 },
  { i: 'predictions', x: 4, y: 24, w: 4, h: 5, minW: 3, minH: 3 },
  { i: 'crypto', x: 8, y: 24, w: 4, h: 5, minW: 3, minH: 3 },
  { i: 'fixedIncome', x: 0, y: 29, w: 12, h: 4, minW: 4, minH: 3 },
];

export const REGION_INDICES = {
  US: [
    { symbol: 'SPY', name: 'S&P 500' },
    { symbol: 'QQQ', name: 'NASDAQ 100' },
    { symbol: 'DIA', name: 'Dow Jones' },
    { symbol: 'VIX', name: 'VIX' },
    { symbol: 'EURUSD', name: 'EUR/USD' },
    { symbol: 'GLD', name: 'Gold' },
    { symbol: 'USO', name: 'Crude Oil' },
    { symbol: 'TLT', name: 'US 20Y Bond' },
  ],
  EU: [
    { symbol: 'EZU', name: 'Euro Stoxx' },
    { symbol: 'EWG', name: 'DAX (Germany)' },
    { symbol: 'EWQ', name: 'CAC 40 (France)' },
    { symbol: 'EWU', name: 'FTSE (UK)' },
    { symbol: 'EURUSD', name: 'EUR/USD' },
    { symbol: 'GBPUSD', name: 'GBP/USD' },
    { symbol: 'GLD', name: 'Gold' },
    { symbol: 'USO', name: 'Brent Oil' },
  ],
  ASIA: [
    { symbol: 'EWJ', name: 'Nikkei (Japan)' },
    { symbol: 'FXI', name: 'China Large Cap' },
    { symbol: 'EWY', name: 'KOSPI (Korea)' },
    { symbol: 'INDA', name: 'Nifty (India)' },
    { symbol: 'USDJPY', name: 'USD/JPY' },
    { symbol: 'USDCNY', name: 'USD/CNY' },
    { symbol: 'GLD', name: 'Gold' },
    { symbol: 'USO', name: 'Crude Oil' },
  ],
};

export const SECTOR_ETFS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLY', name: 'Consumer Cyclical' },
  { symbol: 'XLP', name: 'Consumer Defensive' },
  { symbol: 'XLC', name: 'Communication' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLF', name: 'Financial Services' },
  { symbol: 'XLU', name: 'Utilities' },
  { symbol: 'XLB', name: 'Basic Materials' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLV', name: 'Healthcare' },
];

export const BOND_ETFS = [
  { symbol: 'TIP', name: 'T.I.P.S.' },
  { symbol: 'GOVT', name: 'U.S. Treasuries' },
  { symbol: 'MUB', name: 'Municipals' },
  { symbol: 'CWB', name: 'Convertibles' },
  { symbol: 'HYG', name: 'High Yield' },
  { symbol: 'LQD', name: 'High Grade' },
];

export const CRYPTO_IDS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
];

// API configuration — replace with your own keys
export const API_CONFIG = {
  FMP_API_KEY: 'demo', // Get free key at https://financialmodelingprep.com/
  NEWS_API_KEY: '', // Get free key at https://newsapi.org/
  // TradingView uses embeddable widgets (no API key needed)
};
