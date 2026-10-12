import type { ImageSourcePropType } from 'react-native';

/**
 * Okładki dołączone do aplikacji, przypisane do id bajki.
 * Bajki z katalogu na R2 podają zamiast tego `coverUrl`.
 *
 * Pliki trafiają do assets/covers/<id>.png; po dodaniu pliku dopisz tu wpis, np.:
 *   'test-jezyk': require('../../assets/covers/test-jezyk.png'),
 */
export const localCovers: Record<string, ImageSourcePropType> = {};

/** Ilustracje interfejsu (pusta zakładka „Pobrane” itp.). Brak pliku = widok bez ilustracji. */
export const illustrations: { emptyDownloads?: ImageSourcePropType } = {};
