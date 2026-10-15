import type { Daypart } from '@/logic/daypart';

/**
 * Kolory dla trzech pór dnia (zgodne z makietą „Usypianki – makieta MVP”).
 * Ekrany dziecka biorą paletę z bieżącej pory dnia, ekrany rodzica mają
 * zawsze stonowaną, granatową paletę `parent`.
 */
export type Palette = {
  /** Kolor pod obrazem tła, widoczny zanim tło się wczyta. */
  background: string;
  text: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  /** Półprzezroczyste karty na tapecie i niebie. */
  card: string;
  /** Obramowanie przycisków konturowych. */
  outline: string;
  navBackground: string;
  navBorder: string;
  navActive: string;
  progressTrack: string;
  coverPlaceholder: string;
};

export const palettes: Record<Daypart, Palette> = {
  day: {
    background: '#B5DBF7',
    text: '#23304F',
    textMuted: '#4E5A74',
    accent: '#E0A93B',
    onAccent: '#0E1424',
    card: 'rgba(255,255,255,0.82)',
    outline: '#6F86A6',
    navBackground: '#F4F8FC',
    navBorder: '#DCE6F0',
    navActive: '#DCEBF7',
    progressTrack: '#9EC3E2',
    coverPlaceholder: '#BFD8EC',
  },
  evening: {
    background: '#4A3255',
    text: '#FFF1E4',
    textMuted: '#EBD3C6',
    accent: '#F5B37C',
    onAccent: '#0E1424',
    card: 'rgba(42,26,56,0.70)',
    outline: '#9A7A96',
    navBackground: '#2A1A36',
    navBorder: '#3D2A4C',
    navActive: '#4A3358',
    progressTrack: '#3A2546',
    coverPlaceholder: '#5B4570',
  },
  night: {
    background: '#080E23',
    text: '#ECE7DA',
    textMuted: '#A9B0C0',
    accent: '#E9C77B',
    onAccent: '#0E1424',
    card: 'rgba(14,20,36,0.74)',
    outline: '#3A4562',
    navBackground: '#111829',
    navBorder: '#222B44',
    navActive: '#2B3A5E',
    progressTrack: '#26304A',
    coverPlaceholder: '#3C4A6B',
  },
};

/** Strefa rodzica, bramka i zakup: zawsze spokojny granat, niezależnie od pory. */
export const parent = {
  background: '#0E1424',
  surface: '#1A2238',
  surfaceStrong: '#22304F',
  input: '#141B2E',
  border: '#2B3A5E',
  text: '#ECE7DA',
  textMuted: '#A3AABB',
  textSoft: '#C9CEDA',
  accent: '#E9C77B',
  onAccent: '#0E1424',
  success: '#9BC7A4',
  danger: '#E8A598',
} as const;

/** Ekran trybu nocnego w stanie przyciemnionym. */
export const nightMode = {
  background: '#04060B',
  title: '#7A735F',
  text: '#6E6754',
  hint: '#3E3A2E',
} as const;

export const fonts = {
  regular: 'Baloo2_400Regular',
  medium: 'Baloo2_500Medium',
  semibold: 'Baloo2_600SemiBold',
  bold: 'Baloo2_700Bold',
  extrabold: 'Baloo2_800ExtraBold',
} as const;

export type FontWeight = keyof typeof fonts;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

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

export function formatMegabytes(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1_000_000))} MB`;
}
