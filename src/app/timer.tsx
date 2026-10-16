import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { PillButton, useNavBarStyle } from '@/components/ui';
import { AFTER_STORY_OPTIONS } from '@/logic/resume';
import { usePlayer } from '@/player/player-provider';
import { parent } from '@/theme';

/** „Po bajce”: cisza albo spokojna melodia. Wybór jest zapamiętywany. */
export default function AfterStorySheet() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();
  const { afterStory, setAfterStory } = usePlayer();

  return (
    <View style={{ backgroundColor: parent.surface, paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24, gap: 16 }}>
      <Txt weight="extrabold" size={22} color={parent.text} accessibilityRole="header">
        Po bajce
      </Txt>

      <View accessibilityRole="radiogroup" accessibilityLabel="Co po bajce" style={{ gap: 6 }}>
        {AFTER_STORY_OPTIONS.map((o) => {
          const selected = afterStory === o.mode;
          return (
            <Pressable
              key={o.mode}
              onPress={() => setAfterStory(o.mode)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={{
                minHeight: 64,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: selected ? parent.surfaceStrong : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={16} color={parent.text}>
                  {o.label}
                </Txt>
                <Txt size={13} color={parent.textMuted}>
                  {o.hint}
                </Txt>
              </View>
              {selected && <Icon name="check" color={parent.accent} size={22} />}
            </Pressable>
          );
        })}
      </View>

      <Txt size={13} color={parent.textMuted}>
        Wybór zostaje zapamiętany na kolejne wieczory. Bajka zawsze kończy się w pełnej głośności, a kolejna nie włącza się sama.
      </Txt>

      <PillButton label="Gotowe" onPress={() => router.back()} />
    </View>
  );
}
