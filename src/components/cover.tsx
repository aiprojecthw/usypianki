import { Image } from 'expo-image';
import { View, type DimensionValue } from 'react-native';

import { Icon } from '@/components/icon';
import { localCovers } from '@/data/local-covers';
import type { Story } from '@/data/types';
import { colors } from '@/theme';

type Props = {
  story: Pick<Story, 'id' | 'coverUrl' | 'coverColor'>;
  width: DimensionValue;
  height: number;
  radius: number;
  /** Rozmiar ikony księżyca, gdy brak ilustracji; pominięty = bez ikony. */
  iconSize?: number;
};

export function Cover({ story, width, height, radius, iconSize }: Props) {
  const source = localCovers[story.id] ?? (story.coverUrl ? { uri: story.coverUrl } : undefined);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: story.coverColor ?? colors.surfaceRaised,
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
          accessibilityIgnoresInvertColors
        />
      ) : iconSize ? (
        <Icon name="moon" size={iconSize} color={colors.butter} />
      ) : null}
    </View>
  );
}
