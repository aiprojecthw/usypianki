import { Text, type TextProps } from 'react-native';

import { fonts, type FontWeight } from '@/theme';

type Props = TextProps & {
  weight?: FontWeight;
  size?: number;
  color?: string;
};

/**
 * Tekst w kroju Baloo 2. Na Androidzie każda grubość to osobny plik czcionki,
 * dlatego grubość wybieramy przez `weight`, a nie przez fontWeight.
 */
export function Txt({ weight = 'regular', size = 16, color, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts[weight], fontSize: size, lineHeight: Math.round(size * 1.35), color }, style]}
    />
  );
}
