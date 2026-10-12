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
 *       "coverColor": "#2B3A5E",             // opcjonalnie
 *       "featured": true,                    // opcjonalnie: bajka „Na dziś”
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
  coverColor?: string;
  featured?: boolean;
  sizeBytes?: number;
};

export type Catalog = {
  version: number;
  stories: Story[];
};

/** Wartość audioUrl wskazująca na plik dołączony do aplikacji (tylko dane testowe). */
export const BUNDLED_TEST_AUDIO = 'bundled:test';

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
  const stories = c.stories.filter(isValidStory);
  if (stories.length === 0) return null;
  return { version: typeof c.version === 'number' ? c.version : 1, stories };
}
