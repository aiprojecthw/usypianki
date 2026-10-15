import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { useSettings } from '@/data/settings-provider';
import { palettes, parent, type Palette } from '@/theme';
import { skies, skyPosition, uiIcons } from '@/ui/media';

/** Paleta kolorów dla bieżącej pory dnia. */
export function usePalette(): Palette {
  const { daypart } = useSettings();
  return palettes[daypart];
}

export function goBack(fallback: '/' | '/parent' = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** Niebo pory dnia jako tło całego ekranu (odtwarzacz, „Pobrane”). */
export function SkyBackground({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { daypart } = useSettings();
  const palette = palettes[daypart];
  return (
    <View style={[{ flex: 1, backgroundColor: palette.background }, style]}>
      <Image
        source={skies[daypart]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        contentPosition={skyPosition[daypart]}
        accessibilityIgnoresInvertColors
      />
      {children}
    </View>
  );
}

/** Ilustrowana drewniana strzałka „Wróć” — tylko na ekranach dziecka. */
export function WoodenBackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <Image source={uiIcons.back} style={{ width: 42, height: 32 }} contentFit="contain" />
    </Pressable>
  );
}

/** Nagłówek ekranów rodzica: zwykła strzałka + tytuł. */
export function ParentHeader({ title, onBack, backLabel }: { title?: string; onBack: () => void; backLabel: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -10, minHeight: 48 }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="close" color={parent.text} size={24} />
      </Pressable>
      {title ? (
        <Txt weight="extrabold" size={24} color={parent.text} accessibilityRole="header">
          {title}
        </Txt>
      ) : null}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  accessibilityLabel?: string;
  icon?: ReactNode;
  height?: number;
  colors?: { accent: string; onAccent: string; text: string; outline: string };
  style?: ViewStyle;
};

/** Przycisk w stylu makiety: pełny (akcent) albo konturowy. */
export function PillButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  accessibilityLabel,
  icon,
  height = 52,
  colors = { accent: parent.accent, onAccent: parent.onAccent, text: parent.text, outline: parent.border },
  style,
}: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          height,
          borderRadius: height / 2,
          paddingHorizontal: 20,
          backgroundColor: primary ? colors.accent : 'transparent',
          borderWidth: primary ? 0 : 1,
          borderColor: colors.outline,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {icon}
      <Txt weight={primary ? 'extrabold' : 'bold'} size={16} color={primary ? colors.onAccent : colors.text}>
        {label}
      </Txt>
    </Pressable>
  );
}
