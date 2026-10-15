/**
 * Format katalogu bajek (plik catalog.json na Cloudflare R2).
 *
 * {
 *   "version": 1,
 *   "stories": [
 *     {
 *       "id": "jezyk-ciemnosc",              // unikalny, bez spacji; nazwa pliku po pobraniu
 *       "title": "Jeżyk, który bał się ciemności",
 *       "durationSec": 725,
 *       "audioUrl": "https://<bucket>.r2.dev/audio/jezyk-ciemnosc.mp3",
 *       "coverUrl": "https://<bucket>.r2.dev/covers/jezyk-ciemnosc.png", // opcjonalnie, kwadrat
 *       "coverColor": "#2B3A5E",             // opcjonalnie, tło gdy brak okładki
 *       "featured": true,                    // opcjonalnie: bajka „Na dziś”
 *       "ageLabel": "3–5 lat",               // opcjonalnie
 *       "publishAt": "2026-11-01",           // opcjonalnie: pokazuj od tego dnia
 *       "sizeBytes": 6400000                 // opcjonalnie: pokazywane przy pobieraniu
 *     }
 *   ]
 * }
 */
export type Story = {
  id: string;
  title: string;
  durationSec: number;
  audioUrl: string;
  coverUrl?: string;
  coverColor?: string;
  featured?: boolean;
  sizeBytes?: number;
  ageLabel?: string;
  /** Data (RRRR-MM-DD), od której bajka jest widoczna. Brak = od razu. */
  publishAt?: string;
};

export type Catalog = {
  version: number;
  stories: Story[];
};

/**
 * Prefiks audioUrl wskazujący na nagranie dołączone do aplikacji
 * (tylko bajki testowe), np. "bundled:test-jezyk".
 */
export const BUNDLED_PREFIX = 'bundled:';

export function isBundled(story: Pick<Story, 'audioUrl'>): boolean {
  return story.audioUrl.startsWith(BUNDLED_PREFIX);
}

export function isValidStory(value: unknown): value is Story {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    /^[a-z0-9-]+$/.test(s.id) &&
    typeof s.title === 'string' &&
    typeof s.durationSec === 'number' &&
    typeof s.audioUrl === 'string'
  );
}

export function parseCatalog(value: unknown): Catalog | null {
  if (typeof value !== 'object' || value === null) return null;
  const c = value as Record<string, unknown>;
  if (!Array.isArray(c.stories)) return null;
  const stories = c.stories.filter(isValidStory).filter((s) => isPublished(s, new Date()));
  if (stories.length === 0) return null;
  return { version: typeof c.version === 'number' ? c.version : 1, stories };
}

/** Bajka z datą publikacji w przyszłości jest ukryta do tego dnia. */
export function isPublished(story: Pick<Story, 'publishAt'>, now: Date): boolean {
  if (!story.publishAt) return true;
  const date = new Date(`${story.publishAt}T00:00:00`);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() <= now.getTime();
}
