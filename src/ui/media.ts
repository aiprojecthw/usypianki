import type { ImageSourcePropType } from 'react-native';

import type { Daypart } from '@/logic/daypart';

/**
 * Wszystkie grafiki i nagrania dołączone do aplikacji w jednym miejscu.
 * Źródła w vaultcie: 03_Projects/Audiobooki_na_dobranoc/05_Grafika.
 */
export const wallpapers: Record<Daypart, ImageSourcePropType> = {
  day: require('../../assets/ui/tapeta_dzien.jpg'),
  evening: require('../../assets/ui/tapeta_wieczor.jpg'),
  night: require('../../assets/ui/tapeta_noc.jpg'),
};

/** Krótka animacja jeżyka (5 s, bez dźwięku); ostatnia klatka = tapeta. */
export const wallpaperAnimations: Record<Daypart, number> = {
  day: require('../../assets/video/animacja_dzien.mp4'),
  evening: require('../../assets/video/animacja_wieczor.mp4'),
  night: require('../../assets/video/animacja_noc.mp4'),
};

export const skies: Record<Daypart, ImageSourcePropType> = {
  day: require('../../assets/ui/niebo_dzien.jpg'),
  evening: require('../../assets/ui/niebo_wieczor.jpg'),
  night: require('../../assets/ui/niebo_noc.jpg'),
};

/** Gdzie zakotwiczyć niebo: noc ma księżyc w prawym górnym rogu. */
export const skyPosition: Record<Daypart, 'top' | 'right top'> = {
  day: 'top',
  evening: 'top',
  night: 'right top',
};

export const emptyBaskets: Record<Daypart, ImageSourcePropType> = {
  day: require('../../assets/ui/koszyk_pusty_dzien.png'),
  evening: require('../../assets/ui/koszyk_pusty_wieczor.png'),
  night: require('../../assets/ui/koszyk_pusty_noc.png'),
};

export const playButtons: Record<Daypart, ImageSourcePropType> = {
  day: require('../../assets/ui/play_slonce.png'),
  evening: require('../../assets/ui/play_ksiezyc.png'),
  night: require('../../assets/ui/play_ksiezyc.png'),
};

export const uiIcons = {
  book: require('../../assets/ui/ik_bajki.png') as ImageSourcePropType,
  basket: require('../../assets/ui/ik_koszyk.png') as ImageSourcePropType,
  lock: require('../../assets/ui/ik_klodka.png') as ImageSourcePropType,
  back: require('../../assets/ui/wstecz.png') as ImageSourcePropType,
  moon: require('../../assets/ui/ik_ksiezyc_v2.png') as ImageSourcePropType,
  hourglass: require('../../assets/ui/ik_klepsydra.png') as ImageSourcePropType,
  check: require('../../assets/ui/ptaszek.png') as ImageSourcePropType,
};

/** Melodia po bajce: 10 min, z wbudowanym wejściem (6 s) i wyciszeniem (ostatnia minuta). Wersja testowa. */
export const afterStoryMelody: number = require('../../assets/sounds/melodia-10min.mp3');

export const localCovers: Record<string, ImageSourcePropType> = {
  'test-jezyk': require('../../assets/covers/test-jezyk.jpg'),
  'test-chmurka': require('../../assets/covers/test-chmurka.jpg'),
  'test-latarnik': require('../../assets/covers/test-latarnik.jpg'),
  'test-mis': require('../../assets/covers/test-mis.jpg'),
};

/** Nagrania bajek testowych, wskazywane przez audioUrl "bundled:<id>". */
export const bundledAudio: Record<string, number> = {
  'test-jezyk': require('../../assets/stories/test-jezyk.mp3'),
  'test-chmurka': require('../../assets/stories/test-chmurka.mp3'),
  'test-latarnik': require('../../assets/stories/test-latarnik.mp3'),
  'test-mis': require('../../assets/stories/test-mis.mp3'),
};
