import { router } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { usePlayer, type SleepMode } from '@/player/player-provider';
import { colors, spacing } from '@/theme';

const options: { mode: SleepMode; label: string }[] = [
  { mode: 'end', label: 'Po tej bajce' },
  { mode: 10, label: 'Za 10 minut' },
  { mode: 20, label: 'Za 20 minut' },
  { mode: 30, label: 'Za 30 minut' },
];

export default function TimerSheet() {
  const insets = useSafeAreaInsets();
  const { sleepMode, setSleepMode, fadeOut, setFadeOut } = usePlayer();

  return (
    <View style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.lg, gap: 18 }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
        Wyłącznik czasowy
      </Text>

      <View accessibilityRole="radiogroup" accessibilityLabel="Kiedy zatrzymać" style={{ gap: spacing.xs }}>
        {options.map((o) => {
          const selected = sleepMode === o.mode;
          return (
            <Pressable
              key={String(o.mode)}
              onPress={() => setSleepMode(o.mode)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={{
                minHeight: 52,
                borderRadius: 14,
                paddingHorizontal: spacing.md,
                backgroundColor: selected ? colors.surfaceRaised : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{o.label}</Text>
              {selected && <Icon name="check" color={colors.accent} size={22} />}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 52 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>Ściszaj stopniowo</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Przez ostatnią minutę, bez nagłego urwania</Text>
        </View>
        <Switch
          value={fadeOut}
          onValueChange={setFadeOut}
          accessibilityLabel="Ściszaj stopniowo"
          trackColor={{ true: colors.accent, false: '#3A4562' }}
          thumbColor={colors.text}
        />
      </View>

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        style={{ height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.onAccent, fontSize: 16, fontWeight: '800' }}>Gotowe</Text>
      </Pressable>
    </View>
  );
}
