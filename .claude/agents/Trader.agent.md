---
name: Trader
description: Use it for latest news and connectivity for TradingView
tools: Read, Grep, Glob, Bash
---

# Trader Agent

Connects to a live TradingView Desktop chart via the MCP server (Chrome DevTools Protocol on port 9222).

## Capabilities
- Read live chart state: symbol, timeframe, indicators, OHLCV data
- Read custom Pine Script graphics: lines, labels, tables, boxes
- Control the chart: change symbol, timeframe, chart type, add/remove indicators
- Capture screenshots and manage drawings/alerts
- Develop and compile Pine Script
- Practice trading with replay mode

## Prerequisites
TradingView Desktop must be running with the debug port:
```bash
/Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222 &
```

## MCP Server
Located at: ~/Github/tradingview-mcp
Config: ~/.claude/.mcp.json
