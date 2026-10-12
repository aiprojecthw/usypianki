import { View, type DimensionValue } from 'react-native';

import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type Props = {
  color?: string;
  width: DimensionValue;
  height: number;
  radius: number;
  /** Rozmiar ikony księżyca; pominięty = bez ikony (małe okładki na liście). */
  iconSize?: number;
};

export function Cover({ color, width, height, radius, iconSize }: Props) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        borderCurve: 'continuous',
        backgroundColor: color ?? colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {iconSize ? <Icon name="moon" size={iconSize} color={colors.accent} /> : null}
    </View>
  );
}
