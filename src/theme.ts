// Jedna, ciemna paleta: aplikacja jest używana wieczorem, w zaciemnionym pokoju.
// Akcent jest ciepły (bursztyn), żeby ograniczyć niebieskie światło.
export const colors = {
  background: '#0E1424',
  surface: '#1A2238',
  surfaceRaised: '#2B3A5E',
  border: '#222B44',
  text: '#ECE7DA',
  textMuted: '#A3AABB',
  accent: '#E9C77B',
  onAccent: '#0E1424',
  success: '#9BC7A4',
  warningSurface: '#2A2A22',
  warningText: '#C9C2AE',
  night: '#04060B',
  nightText: '#8F8670',
  nightButton: '#6E6754',
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
