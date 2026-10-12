// Pastelowa noc: tło to przygaszony granat z ilustracji (#161B33), a pastele
// (lawenda, brzoskwinia, mięta, masło) służą jako akcenty. Jasne pastelowe tło
// świeciłoby wieczorem po oczach, dlatego pastele są tylko na wierzchu.
export const colors = {
  background: '#161B33',
  surface: '#20274A',
  surfaceRaised: '#2C3560',
  border: '#2A3157',
  text: '#F3EEE6',
  textMuted: '#AEB4CC',
  accent: '#C9B8F0', // lawenda: główne przyciski
  onAccent: '#1D1A3A',
  peach: '#F5C9B3',
  mint: '#B8E3D0',
  butter: '#F3E3A6',
  success: '#B8E3D0',
  warningSurface: '#2E2A44',
  warningText: '#D9CFEA',
  night: '#07080F',
  nightText: '#8E87A8',
  nightButton: '#6C6688',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 14, md: 22, pill: 999 } as const;

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, '0')}`;
}

/** Polska odmiana: 1 bajka, 2–4 bajki, 5+ bajek (12–14 też „bajek”). */
export function storiesCount(n: number): string {
  if (n === 1) return '1 bajka';
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} bajki`;
  return `${n} bajek`;
}

export function formatMinutes(totalSeconds: number): string {
  return `${Math.max(1, Math.round(totalSeconds / 60))} min`;
}
