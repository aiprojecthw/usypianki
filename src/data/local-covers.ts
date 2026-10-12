import type { ImageSourcePropType } from 'react-native';

/**
 * Okładki dołączone do aplikacji, przypisane do id bajki.
 * Bajki z katalogu na R2 podają zamiast tego `coverUrl`.
 *
 * Nowa okładka w aplikacji: plik assets/covers/<id>.jpg (kwadrat, ~640 px) + wpis poniżej.
 */
export const localCovers: Record<string, ImageSourcePropType> = {
  'test-jezyk': require('../../assets/covers/test-jezyk.jpg'),
  'test-chmurka': require('../../assets/covers/test-chmurka.jpg'),
  'test-latarnik': require('../../assets/covers/test-latarnik.jpg'),
  'test-mis': require('../../assets/covers/test-mis.jpg'),
};

/** Ilustracje interfejsu. */
export const illustrations: { emptyDownloads?: ImageSourcePropType } = {
  emptyDownloads: require('../../assets/illustrations/empty-downloads.png'),
};
