import { useState, useEffect, useCallback, useRef } from 'react';

export type RefreshInterval = 'schedule' | '1min' | '5min' | '30min' | '1hour';

export interface RefreshConfig {
  mode: RefreshInterval;
  /** For 'schedule' mode: HH:MM in CET (Europe/Warsaw) */
  scheduleTime: string;
}

export const REFRESH_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: 'schedule', label: '🕗 Daily at 7:30 AM CET' },
  { value: '1min', label: '⚡ Every 1 minute' },
  { value: '5min', label: '🔄 Every 5 minutes' },
  { value: '30min', label: '⏱ Every 30 minutes' },
  { value: '1hour', label: '🕐 Every 1 hour' },
];

const INTERVAL_MS: Record<Exclude<RefreshInterval, 'schedule'>, number> = {
  '1min': 60_000,
  '5min': 5 * 60_000,
  '30min': 30 * 60_000,
  '1hour': 60 * 60_000,
};

/** Returns ms until next HH:MM in Europe/Warsaw timezone */
function msUntilNextCET(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  // Build today's target in CET using Intl
  const cetFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = cetFormatter.formatToParts(now);
  const cetH = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const cetM = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const cetS = Number(parts.find((p) => p.type === 'second')?.value ?? 0);

  const targetTotalSec = h * 3600 + m * 60;
  const nowTotalSec = cetH * 3600 + cetM * 60 + cetS;

  let diffSec = targetTotalSec - nowTotalSec;
  if (diffSec <= 0) diffSec += 24 * 3600; // schedule for next day
  return diffSec * 1000;
}

/**
 * Triggers a callback on the configured schedule.
 * Returns { triggerCount, lastRefresh, config, setConfig, manualRefresh }
 */
export function useScheduledRefresh(onRefresh: () => void, storageKey = 'xtb-refresh-config') {
  const [config, setConfigState] = useState<RefreshConfig>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as RefreshConfig;
    } catch { /* ignore */ }
    return { mode: 'schedule', scheduleTime: '07:30' };
  });

  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [triggerCount, setTriggerCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setConfig = useCallback((next: RefreshConfig) => {
    setConfigState(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
  }, [storageKey]);

  const fire = useCallback(() => {
    onRefresh();
    setLastRefresh(new Date());
    setTriggerCount((c) => c + 1);
  }, [onRefresh]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    function schedule() {
      let ms: number;
      if (config.mode === 'schedule') {
        ms = msUntilNextCET(config.scheduleTime);
      } else {
        ms = INTERVAL_MS[config.mode];
      }

      timerRef.current = setTimeout(() => {
        fire();
        schedule(); // reschedule
      }, ms);
    }

    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [config, fire]);

  const manualRefresh = useCallback(() => { fire(); }, [fire]);

  return { triggerCount, lastRefresh, config, setConfig, manualRefresh };
}
