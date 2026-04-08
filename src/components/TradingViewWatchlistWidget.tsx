import { useEffect, useRef, memo } from 'react';
import WidgetCard from './WidgetCard';
import { useDashboard } from '../context/DashboardContext';

/**
 * TradingView Watchlist Widget — embeds the official TradingView watchlist.
 * 
 * HOW TO SYNC YOUR TRADINGVIEW ACCOUNT WATCHLIST:
 * ─────────────────────────────────────────────────
 * TradingView embeddable widgets don't directly expose your private account watchlist
 * via an API. However, there are several approaches to connect:
 * 
 * 1. **Manual Sync (Current)**: Add symbols manually here — they appear in the
 *    TradingView Market Overview widget below as well as the Custom Watchlist.
 * 
 * 2. **TradingView "Share Watchlist" URL**: In TradingView, go to your watchlist,
 *    click "..." > "Share" > copy the public URL. You can then parse the symbols.
 * 
 * 3. **TradingView Broker Integration (Pine Script)**: If you connect a broker to
 *    TradingView, your positions auto-populate. The widget below reflects this when
 *    the user is logged in to TradingView in the same browser session.
 * 
 * 4. **TradingView REST API (Partner/Enterprise)**: TradingView offers a partner-level
 *    REST API for brokers and data providers. Contact sales@tradingview.com for access.
 * 
 * Docs: https://www.tradingview.com/widget-docs/widgets/watchlists/market-overview/
 */
function TradingViewWatchlistWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state } = useDashboard();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'tradingview-widget-container__widget';
    innerDiv.style.width = '100%';
    innerDiv.style.height = '100%';
    widgetDiv.appendChild(innerDiv);

    // Build symbol tabs from user's watchlist + default groups
    const tabs = [
      {
        title: 'My Watchlist',
        symbols: state.tradingViewSymbols.map(s => ({
          s: `NASDAQ:${s}`,
          d: s,
        })),
      },
      {
        title: 'US Indices',
        symbols: [
          { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
          { s: 'FOREXCOM:NSXUSD', d: 'NASDAQ 100' },
          { s: 'FOREXCOM:DJI', d: 'Dow Jones' },
          { s: 'CBOE:VIX', d: 'VIX' },
        ],
      },
      {
        title: 'Forex',
        symbols: [
          { s: 'FX:EURUSD', d: 'EUR/USD' },
          { s: 'FX:GBPUSD', d: 'GBP/USD' },
          { s: 'FX:USDJPY', d: 'USD/JPY' },
          { s: 'FX:USDCHF', d: 'USD/CHF' },
        ],
      },
      {
        title: 'Commodities',
        symbols: [
          { s: 'TVC:GOLD', d: 'Gold' },
          { s: 'TVC:SILVER', d: 'Silver' },
          { s: 'NYMEX:CL1!', d: 'Crude Oil' },
          { s: 'NYMEX:NG1!', d: 'Natural Gas' },
        ],
      },
    ];

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.textContent = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '1D',
      showChart: true,
      locale: 'en',
      largeChartUrl: '',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      width: '100%',
      height: '100%',
      tabs,
    });

    widgetDiv.appendChild(script);
    container.appendChild(widgetDiv);

    return () => {
      container.innerHTML = '';
    };
  }, [state.tradingViewSymbols]);

  return (
    <WidgetCard
      title="TradingView Watchlist"
      icon="👁️"
      headerRight={
        <span className="text-[10px] text-white/30">
          {state.tradingViewSymbols.length} symbols
        </span>
      }
    >
      <div ref={containerRef} className="h-full min-h-[300px]" />
    </WidgetCard>
  );
}

export default memo(TradingViewWatchlistWidget);
