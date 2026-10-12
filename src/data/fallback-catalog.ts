import { BUNDLED_TEST_AUDIO, type Catalog } from './types';

/**
 * Katalog testowy, używany dopóki w app.json (extra.catalogUrl) nie ma adresu
 * prawdziwego katalogu na Cloudflare R2. Wszystkie pozycje odtwarzają ten sam
 * dołączony plik testowy (90 s szumu), żeby dało się sprawdzić odtwarzacz,
 * wyłącznik czasowy i tryb nocny bez internetu.
 */
export const fallbackCatalog: Catalog = {
  version: 1,
  stories: [
    {
      id: 'test-jezyk',
      title: 'Jeżyk, który bał się ciemności',
      durationSec: 90,
      audioUrl: BUNDLED_TEST_AUDIO,
      coverColor: '#2B3A5E',
      featured: true,
    },
    {
      id: 'test-chmurka',
      title: 'Mała chmurka szuka domu',
      durationSec: 90,
      audioUrl: BUNDLED_TEST_AUDIO,
      coverColor: '#3C4A6B',
    },
    {
      id: 'test-latarnik',
      title: 'Latarnik z Wąskiej Zatoki',
      durationSec: 90,
      audioUrl: BUNDLED_TEST_AUDIO,
      coverColor: '#4A3E5C',
    },
    {
      id: 'test-mis',
      title: 'Miś Bruno liczy gwiazdy',
      durationSec: 90,
      audioUrl: BUNDLED_TEST_AUDIO,
      coverColor: '#2F4A4E',
    },
  ],
};
