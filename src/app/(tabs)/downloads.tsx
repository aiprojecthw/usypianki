import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { StoryRow } from '@/components/story-row';
import { useIsOffline, useStartStory } from '@/components/use-start-story';
import { useCatalog } from '@/data/catalog-provider';
import { useDownloads } from '@/data/downloads-provider';
import { colors, spacing, storiesCount } from '@/theme';

export default function DownloadsScreen() {
  const insets = useSafeAreaInsets();
  const { stories } = useCatalog();
  const { downloaded } = useDownloads();
  const start = useStartStory();
  const offline = useIsOffline();

  const items = stories.filter((s) => s.id in downloaded);
  const totalMb = Math.round(Object.values(downloaded).reduce((sum, b) => sum + b, 0) / 1_000_000);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: 20, paddingBottom: spacing.xl, gap: spacing.md }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>
        Pobrane
      </Text>

      {offline && (
        <View
          accessibilityRole="alert"
          style={{ backgroundColor: colors.warningSurface, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12 }}>
          <Icon name="offline" color={colors.accent} size={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Brak internetu</Text>
            <Text style={{ color: colors.warningText, fontSize: 14 }}>
              Pobrane bajki działają bez sieci. Nowe pojawią się, gdy wróci połączenie.
            </Text>
          </View>
        </View>
      )}

      {items.length === 0 ? (
        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.md }}>
          <Icon name="download" size={40} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>Nic jeszcze nie pobrano</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
            Dotknij strzałki przy bajce w zakładce „Bajki”, żeby słuchać jej bez internetu, np. w podróży albo u babci.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ gap: spacing.xs }}>
            {items.map((s) => (
              <StoryRow key={s.id} story={s} action="delete" onPress={() => start(s)} />
            ))}
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {storiesCount(items.length)} · {totalMb} MB na telefonie
          </Text>
        </>
      )}
    </ScrollView>
  );
}
