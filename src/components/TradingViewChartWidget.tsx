import { useEffect, useRef, memo } from 'react';
import WidgetCard from './WidgetCard';
import { useDashboard } from '../context/DashboardContext';

/**
 * TradingView Advanced Chart Widget — embeds an interactive chart.
 * Supports technical analysis tools, indicators, and drawing tools.
 * When the user is logged into TradingView in the same browser, their 
 * saved chart layouts and watchlist are automatically available.
 * 
 * Docs: https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/
 */
function TradingViewChartWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state } = useDashboard();

  // Pick the first watchlist symbol or default to SPY
  const symbol = state.tradingViewSymbols[0] || 'SPY';

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';

    const innerDiv = document.createElement('div');
    innerDiv.id = `tradingview-chart-${Date.now()}`;
    innerDiv.style.width = '100%';
    innerDiv.style.height = '100%';
    widgetDiv.appendChild(innerDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: false,
      withdateranges: true,
      hide_volume: false,
      isTransparent: true,
    });

    widgetDiv.appendChild(script);
    container.appendChild(widgetDiv);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol]);

  return (
    <WidgetCard
      title="TradingView Chart"
      icon="📉"
      headerRight={
        <span className="text-xs text-accent/60 font-mono">{symbol}</span>
      }
    >
      <div ref={containerRef} className="h-full min-h-[350px]" />
    </WidgetCard>
  );
}

export default memo(TradingViewChartWidget);
