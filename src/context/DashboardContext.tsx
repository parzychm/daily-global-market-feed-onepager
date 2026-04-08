import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { DashboardState, Theme, Region, WidgetId, LayoutItem } from '../types';
import { DEFAULT_WIDGETS, DEFAULT_LAYOUTS } from '../config/defaults';

// ── Actions ──

type Action =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_REGION'; payload: Region }
  | { type: 'TOGGLE_WIDGET'; payload: WidgetId }
  | { type: 'SET_LAYOUTS'; payload: LayoutItem[] }
  | { type: 'SET_REFRESH_INTERVAL'; payload: number }
  | { type: 'ADD_TV_SYMBOL'; payload: string }
  | { type: 'REMOVE_TV_SYMBOL'; payload: string }
  | { type: 'RESET_DEFAULTS' };

// ── Initial State ──

const STORAGE_KEY = 'dgmf-dashboard-state';

function loadState(): DashboardState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...getDefaultState(),
        ...parsed,
        widgets: parsed.widgets || DEFAULT_WIDGETS,
        layouts: parsed.layouts || DEFAULT_LAYOUTS,
      };
    }
  } catch {
    // ignore
  }
  return getDefaultState();
}

function getDefaultState(): DashboardState {
  return {
    theme: 'dark',
    region: 'US',
    widgets: DEFAULT_WIDGETS,
    layouts: DEFAULT_LAYOUTS,
    refreshInterval: 300,
    tradingViewSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'],
  };
}

// ── Reducer ──

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_REGION':
      return { ...state, region: action.payload };
    case 'TOGGLE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map((w) =>
          w.id === action.payload ? { ...w, enabled: !w.enabled } : w
        ),
      };
    case 'SET_LAYOUTS':
      return { ...state, layouts: action.payload };
    case 'SET_REFRESH_INTERVAL':
      return { ...state, refreshInterval: action.payload };
    case 'ADD_TV_SYMBOL': {
      if (state.tradingViewSymbols.includes(action.payload.toUpperCase())) return state;
      return {
        ...state,
        tradingViewSymbols: [...state.tradingViewSymbols, action.payload.toUpperCase()],
      };
    }
    case 'REMOVE_TV_SYMBOL':
      return {
        ...state,
        tradingViewSymbols: state.tradingViewSymbols.filter((s) => s !== action.payload),
      };
    case 'RESET_DEFAULTS':
      return getDefaultState();
    default:
      return state;
  }
}

// ── Context ──

interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<Action>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Apply theme class to html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    document.documentElement.classList.toggle('light', state.theme === 'light');
  }, [state.theme]);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
