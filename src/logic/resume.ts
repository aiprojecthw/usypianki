/**
 * Zapamiętywanie miejsca, w którym przerwano bajkę.
 * Nie wznawiamy, gdy dziecko słuchało tylko chwilę albo bajka była prawie
 * skończona — wtedy lepiej zacząć od początku.
 */
export const RESUME_MIN_SECONDS = 15;
export const RESUME_END_MARGIN_SECONDS = 30;

export function resumePosition(saved: number | undefined, durationSec: number): number {
  if (saved === undefined || !Number.isFinite(saved)) return 0;
  if (saved < RESUME_MIN_SECONDS) return 0;
  if (durationSec > 0 && saved > durationSec - RESUME_END_MARGIN_SECONDS) return 0;
  return Math.floor(saved);
}

/** Opcje wyłącznika czasowego: po bieżącej bajce albo po N minutach. */
export type SleepMode = 'end' | 15 | 30 | 45;

export const SLEEP_OPTIONS: { mode: SleepMode; short: string; long: string }[] = [
  { mode: 'end', short: 'Po tej bajce', long: 'Po tej bajce' },
  { mode: 15, short: '15 min', long: 'Za 15 minut' },
  { mode: 30, short: '30 min', long: 'Za 30 minut' },
  { mode: 45, short: '45 min', long: 'Za 45 minut' },
];

export function isSleepMode(value: unknown): value is SleepMode {
  return value === 'end' || value === 15 || value === 30 || value === 45;
}

/** Etykieta na przycisku w odtwarzaczu. */
export function sleepLabel(mode: SleepMode, secondsLeft: number, active: boolean): string {
  if (mode === 'end') return 'Po tej bajce';
  if (!active) return `${mode} min`;
  return `Za ${Math.max(1, Math.ceil(secondsLeft / 60))} min`;
}
