import { BUNDLED_PREFIX, type Catalog } from './types';

/**
 * Bajki testowe dołączone do aplikacji. Używane, dopóki w app.json
 * (extra.catalogUrl) nie ma adresu prawdziwego katalogu na Cloudflare R2.
 *
 * Nagrania to krótkie teksty czytane syntezatorem mowy (espeak-ng), tylko do
 * sprawdzenia odtwarzacza, wyłącznika czasowego i trybu nocnego. Prawdziwe
 * bajki będą nagrane w ElevenLabs po zatwierdzeniu tekstów.
 */
export const fallbackCatalog: Catalog = {
  version: 1,
  stories: [
    {
      id: 'test-jezyk',
      title: 'Jeżyk, który bał się ciemności',
      durationSec: 96,
      audioUrl: `${BUNDLED_PREFIX}test-jezyk`,
      coverColor: '#2B3A5E',
      featured: true,
      ageLabel: '3–5 lat',
    },
    {
      id: 'test-chmurka',
      title: 'Mała chmurka szuka domu',
      durationSec: 100,
      audioUrl: `${BUNDLED_PREFIX}test-chmurka`,
      coverColor: '#3C4A6B',
      ageLabel: '3–5 lat',
    },
    {
      id: 'test-latarnik',
      title: 'Latarnik z Wąskiej Zatoki',
      durationSec: 99,
      audioUrl: `${BUNDLED_PREFIX}test-latarnik`,
      coverColor: '#4A3E5C',
      ageLabel: '5–6 lat',
    },
    {
      id: 'test-mis',
      title: 'Miś Bruno liczy gwiazdy',
      durationSec: 95,
      audioUrl: `${BUNDLED_PREFIX}test-mis`,
      coverColor: '#2F4A4E',
      ageLabel: '3–5 lat',
    },
  ],
};
