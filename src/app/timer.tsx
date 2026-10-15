import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { PillButton } from '@/components/ui';
import { SLEEP_OPTIONS } from '@/logic/resume';
import { usePlayer } from '@/player/player-provider';
import { parent } from '@/theme';

/** Wyłącznik czasowy dla bieżącej bajki. Domyślne ustawienie zmienia rodzic. */
export default function TimerSheet() {
  const insets = useSafeAreaInsets();
  const { sleepMode, setSleepMode } = usePlayer();

  return (
    <View style={{ backgroundColor: parent.surface, paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24, gap: 16 }}>
      <Txt weight="extrabold" size={22} color={parent.text} accessibilityRole="header">
        Wyłącznik czasowy
      </Txt>

      <View accessibilityRole="radiogroup" accessibilityLabel="Kiedy zatrzymać" style={{ gap: 4 }}>
        {SLEEP_OPTIONS.map((o) => {
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
                paddingHorizontal: 16,
                backgroundColor: selected ? parent.surfaceStrong : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Txt weight="bold" size={16} color={parent.text}>
                {o.long}
              </Txt>
              {selected && <Icon name="check" color={parent.accent} size={22} />}
            </Pressable>
          );
        })}
      </View>

      <Txt size={13} color={parent.textMuted}>
        Przez ostatnią minutę dźwięk stopniowo cichnie. Potem jest cisza — kolejna bajka nie włącza się sama.
      </Txt>

      <PillButton label="Gotowe" onPress={() => router.back()} />
    </View>
  );
}
