/** Pora dnia decyduje o tapecie, kolorach i przycisku odtwarzania. */
export type Daypart = 'day' | 'evening' | 'night';

/** Godziny granic pór dnia w minutach od północy (czas lokalny telefonu). */
export type DaypartBounds = {
  dayStart: number;
  eveningStart: number;
  nightStart: number;
};

export const DEFAULT_BOUNDS: DaypartBounds = {
  dayStart: 6 * 60,
  eveningStart: 17 * 60,
  nightStart: 19 * 60,
};

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Zwraca porę dnia dla podanej chwili.
 * Noc trwa od `nightStart` do `dayStart` następnego dnia (przechodzi przez północ).
 */
export function daypartAt(date: Date, bounds: DaypartBounds = DEFAULT_BOUNDS): Daypart {
  const m = minutesOfDay(date);
  const { dayStart, eveningStart, nightStart } = normalizeBounds(bounds);
  if (m >= dayStart && m < eveningStart) return 'day';
  if (m >= eveningStart && m < nightStart) return 'evening';
  return 'night';
}

/**
 * Pilnuje kolejności: dzień < wieczór < noc. Błędne ustawienia (np. wieczór
 * przed dniem) wracają do wartości domyślnych zamiast psuć aplikację.
 */
export function normalizeBounds(bounds: DaypartBounds): DaypartBounds {
  const valid = (v: number) => Number.isInteger(v) && v >= 0 && v < 24 * 60;
  const { dayStart, eveningStart, nightStart } = bounds;
  if (!valid(dayStart) || !valid(eveningStart) || !valid(nightStart)) return DEFAULT_BOUNDS;
  if (!(dayStart < eveningStart && eveningStart < nightStart)) return DEFAULT_BOUNDS;
  return bounds;
}

/** 360 → "06:00" */
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Przesuwa jedną z granic o `delta` minut (krok w Strefie rodzica: 30 min),
 * nie pozwalając wyjść poza sąsiednie granice. Zwraca nowe granice.
 */
export function shiftBound(bounds: DaypartBounds, key: keyof DaypartBounds, delta: number): DaypartBounds {
  const STEP_GAP = 30;
  const next = { ...bounds, [key]: bounds[key] + delta };
  const min = key === 'dayStart' ? 0 : key === 'eveningStart' ? next.dayStart + STEP_GAP : next.eveningStart + STEP_GAP;
  const max =
    key === 'dayStart' ? next.eveningStart - STEP_GAP : key === 'eveningStart' ? next.nightStart - STEP_GAP : 24 * 60 - STEP_GAP;
  next[key] = Math.min(max, Math.max(min, next[key]));
  return next;
}

export function greetingFor(daypart: Daypart): { hello: string; subtitle: string } {
  switch (daypart) {
    case 'day':
      return { hello: 'Dzień dobry', subtitle: 'Co posłuchamy dziś?' };
    case 'evening':
      return { hello: 'Dobry wieczór', subtitle: 'Za chwilę pora na bajkę' };
    case 'night':
      return { hello: 'Dobranoc', subtitle: 'Jeżyk już śpi. Twoja kolej.' };
  }
}
