import { useEffect, useRef, memo } from 'react';
import WidgetCard from './WidgetCard';

/**
 * TradingView Timeline Widget — embeds real-time market news directly from TradingView.
 * This uses the official TradingView embeddable widget (no API key needed).
 * When you're logged into TradingView in the same browser, it can pull your personalized feed.
 * 
 * Docs: https://www.tradingview.com/widget-docs/widgets/news/timeline/
 */
function TradingViewNewsWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any previous widget
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

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.type = 'text/javascript';
    script.async = true;
    script.textContent = JSON.stringify({
      feedMode: 'all_symbols',
      isTransparent: true,
      displayMode: 'regular',
      width: '100%',
      height: '100%',
      colorTheme: 'dark',
      locale: 'en',
    });

    widgetDiv.appendChild(script);
    container.appendChild(widgetDiv);
    scriptRef.current = script;

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <WidgetCard title="TradingView News" icon="📰">
      <div ref={containerRef} className="h-full min-h-[300px]" />
    </WidgetCard>
  );
}

export default memo(TradingViewNewsWidget);
