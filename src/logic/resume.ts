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

/**
 * Co dzieje się po zakończeniu bajki. Bajka zawsze kończy się w pełnej
 * głośności (zakończenie „Dobranoc” musi być słyszalne); dopiero potem
 * może zagrać spokojna melodia, która sama płynnie cichnie.
 */
export type AfterStory = 'silence' | 'melody';

export const AFTER_STORY_OPTIONS: { mode: AfterStory; label: string; short: string; hint: string }[] = [
  { mode: 'silence', label: 'Cisza', short: 'Cisza po bajce', hint: 'Bajka kończy się i zapada cisza.' },
  {
    mode: 'melody',
    label: 'Spokojna melodia, 10 min',
    short: 'Melodia 10 min',
    hint: 'Po bajce gra cicha melodia, która na końcu płynnie wycisza się.',
  },
];

export function isAfterStory(value: unknown): value is AfterStory {
  return value === 'silence' || value === 'melody';
}

export function afterStoryLabel(mode: AfterStory): string {
  return AFTER_STORY_OPTIONS.find((o) => o.mode === mode)?.short ?? 'Cisza po bajce';
}
