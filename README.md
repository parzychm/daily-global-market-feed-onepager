# Daily Global Market Feed — One-Pager Dashboard

A customizable, real-time financial markets dashboard inspired by [Perplexity Finance](https://www.perplexity.ai/finance). Built with React + TypeScript + Vite + TailwindCSS, with **TradingView widget integration** for charts, news, and watchlist syncing.

**[Live Demo →](https://parzychm.github.io/daily-global-market-feed-onepager/)**

---

## Features

- **13 Customizable Widgets**: Ticker bar, market summary, S&P 500 heatmap, news feed, standout stocks, sector performance, gainers/losers, watchlist, predictions, crypto, fixed income, and 3 TradingView widgets
- **TradingView Integration**:
  - 📰 **News Timeline** — real-time market news via TradingView embeddable widget
  - 👁️ **Watchlist** — synced with your custom symbol list + default groups (indices, forex, commodities)
  - 📉 **Advanced Chart** — interactive chart with technical analysis tools
- **Dark/Light Mode** with system preference detection
- **Region Switching** — US / EU / Asia market views
- **Widget Toggle** — show/hide any section
- **Auto-Refresh** — configurable polling intervals (1min, 5min, 15min, manual)
- **Persistent Settings** — all preferences saved to localStorage
- **Responsive Design** — mobile, tablet, and desktop layouts
- **Auto-Deploy** — GitHub Actions CI/CD to GitHub Pages

## TradingView Account Sync

The TradingView widgets work best when you're **logged into TradingView in the same browser**:

1. Your saved chart layouts and indicators are automatically available in the Chart widget
2. The Watchlist widget shows your custom symbols (configurable in Settings)
3. The News widget shows personalized market news

**To add your TradingView watchlist symbols:**
- Click ⚙️ **Customize** → scroll to **TradingView Watchlist Symbols**
- Or type symbols directly in the **Custom Watchlist** widget's input field

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 + CSS custom properties |
| Charts | TradingView Embeddable Widgets (chart, watchlist, news) |
| Heatmap | Custom CSS grid treemap |
| Sparklines | Inline SVG |
| Data APIs | Financial Modeling Prep, CoinGecko, Polymarket |
| State | React Context + useReducer + localStorage |
| Deploy | GitHub Pages via GitHub Actions |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Keys

Replace the demo keys in `src/config/defaults.ts`:

| API | Free Tier | URL |
|-----|-----------|-----|
| Financial Modeling Prep | 250 req/day | https://financialmodelingprep.com/ |
| CoinGecko | 10-30 req/min | https://www.coingecko.com/api |
| TradingView Widgets | Unlimited (embeddable) | https://www.tradingview.com/widget/ |

## Deploy to GitHub Pages

1. Go to **Settings → Pages** in your repo
2. Set Source to **GitHub Actions**
3. Push to `main` — the workflow auto-deploys

## Project Structure

```
src/
├── components/         # All widget components
│   ├── Header.tsx
│   ├── SettingsPanel.tsx
│   ├── TickerBar.tsx
│   ├── MarketSummaryWidget.tsx
│   ├── HeatmapWidget.tsx
│   ├── NewsFeedWidget.tsx
│   ├── StandoutsWidget.tsx
│   ├── SectorsWidget.tsx
│   ├── MoversWidget.tsx
│   ├── WatchlistWidget.tsx
│   ├── PredictionsWidget.tsx
│   ├── CryptoWidget.tsx
│   ├── FixedIncomeWidget.tsx
│   ├── TradingViewNewsWidget.tsx      # TradingView news timeline
│   ├── TradingViewWatchlistWidget.tsx # TradingView market overview
│   ├── TradingViewChartWidget.tsx     # TradingView advanced chart
│   ├── WidgetCard.tsx
│   └── Skeleton.tsx
├── config/
│   └── defaults.ts     # Widget configs, API keys, region mappings
├── context/
│   └── DashboardContext.tsx  # Global state management
├── hooks/
│   └── usePolling.ts   # Data polling hook
├── services/
│   └── marketData.ts   # API fetchers + mock data
├── types/
│   └── index.ts        # TypeScript interfaces
├── utils/
│   └── format.ts       # Formatting helpers
├── App.tsx
├── main.tsx
└── index.css
```

## License

MIT