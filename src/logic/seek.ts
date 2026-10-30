/**
 * Przewijanie bajki (suwak, ±15 s, ekran blokady).
 *
 * Cel jest przycinany do [0, długość − 1 s]: przeskok na sam koniec od razu
 * kończyłby bajkę i — przy „Po bajce: melodia” — włączał melodię.
 */
export function clampSeekTarget(target: number, duration: number): number {
  const end = Math.max(0, duration - 1);
  if (!Number.isFinite(target)) return 0;
  return Math.min(Math.max(0, target), end);
}

/**
 * Czy przewinięcie ma wrócić do bajki i ją odtwarzać.
 *
 * Gdy gra melodia po bajce, a rodzic przewija bajkę wstecz, chce dalej słuchać
 * bajki: melodia musi ucichnąć, a bajka zagrać od wybranego miejsca.
 * Bez tego obie grały naraz (Android wznawia skończone nagranie po przewinięciu).
 */
export function seekReturnsToStory(melodyPlaying: boolean): boolean {
  return melodyPlaying;
}
