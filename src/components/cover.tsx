import { Image } from 'expo-image';
import { View, type DimensionValue } from 'react-native';

import type { Story } from '@/data/types';
import { localCovers, uiIcons } from '@/ui/media';

type Props = {
  story: Pick<Story, 'id' | 'coverUrl' | 'coverColor'>;
  width: DimensionValue;
  height: number;
  radius: number;
  placeholderColor: string;
};

/** Okładka bajki; bez okładki pokazuje przygaszony półksiężyc na kolorze bajki. */
export function Cover({ story, width, height, radius, placeholderColor }: Props) {
  const source = localCovers[story.id] ?? (story.coverUrl ? { uri: story.coverUrl } : undefined);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: story.coverColor ?? placeholderColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {source ? (
        <Image
          source={source}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          // Bez tego Android dekodował okładkę do zbyt małej bitmapy i na ekranie głównym
          // (64 dp) była wyraźnie rozmyta. Okładki mają 640 px, więc pamięć nie jest problemem.
          allowDownscaling={false}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Image source={uiIcons.moon} style={{ width: height * 0.4, height: height * 0.4, opacity: 0.5 }} contentFit="contain" />
      )}
    </View>
  );
}
