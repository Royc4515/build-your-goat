// Daily-challenge streak storage. Only module allowed to touch localStorage
// for streak data. Schema-validated on read so stale/corrupt data can't crash.

const KEY = 'byg:streak';

export interface StreakData {
  readonly current: number;
  readonly best: number;
  readonly lastDate: string | null;
  readonly history: Readonly<Record<string, number>>; // date → overall scored
}

const DEFAULT: StreakData = { current: 0, best: 0, lastDate: null, history: {} };

function load(): StreakData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      current: typeof p.current === 'number' ? p.current : 0,
      best: typeof p.best === 'number' ? p.best : 0,
      lastDate: typeof p.lastDate === 'string' ? p.lastDate : null,
      history: typeof p.history === 'object' && p.history !== null
        ? (p.history as Record<string, number>)
        : {},
    };
  } catch {
    return DEFAULT;
  }
}

function save(data: StreakData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* quota / private browsing — ignore */ }
}

export function getStreak(): StreakData {
  return load();
}

export function hasPlayedToday(dateStr: string): boolean {
  return dateStr in load().history;
}

/** Record a completed daily, update streak, return the new state. Idempotent:
 *  calling it twice on the same date returns the stored data unchanged. */
export function recordDailyPlay(dateStr: string, overall: number): StreakData {
  const data = load();
  if (dateStr in data.history) return data;

  const yesterday = new Date(`${dateStr}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  const continues = data.lastDate === yStr;
  const newCurrent = continues ? data.current + 1 : 1;
  const updated: StreakData = {
    current: newCurrent,
    best: Math.max(data.best, newCurrent),
    lastDate: dateStr,
    history: { ...data.history, [dateStr]: overall },
  };
  save(updated);
  return updated;
}
