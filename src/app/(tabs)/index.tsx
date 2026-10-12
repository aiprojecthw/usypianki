import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { Icon } from '@/components/icon';
import { StoryRow } from '@/components/story-row';
import { useIsOffline, useStartStory } from '@/components/use-start-story';
import { useCatalog } from '@/data/catalog-provider';
import { colors, formatMinutes, radius, spacing } from '@/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 18 || h < 4) return 'Dobry wieczór';
  if (h < 12) return 'Dzień dobry';
  return 'Cześć';
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { stories, featured, loading, isTestData, refresh } = useCatalog();
  const start = useStartStory();
  const offline = useIsOffline();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: 20, paddingBottom: spacing.xl, gap: 22 }}
      contentInsetAdjustmentBehavior="never"
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.accent} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>{greeting()}</Text>
          <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>
            Usypianki
          </Text>
        </View>
        <Link href="/about" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="O aplikacji"
            style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="info" color={colors.textMuted} />
          </Pressable>
        </Link>
      </View>

      {isTestData && (
        <Text style={{ color: colors.warningText, backgroundColor: colors.warningSurface, padding: 12, borderRadius: 14, fontSize: 13 }}>
          Wersja testowa: bajki odtwarzają ten sam dźwięk próbny. Prawdziwy katalog pojawi się po podaniu adresu w ustawieniach aplikacji.
        </Text>
      )}

      {offline && (
        <Text style={{ color: colors.warningText, backgroundColor: colors.warningSurface, padding: 12, borderRadius: 14, fontSize: 13 }}>
          Brak internetu. Działają bajki z zakładki „Pobrane”.
        </Text>
      )}

      {loading && stories.length === 0 && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />}

      {!loading && stories.length === 0 && (
        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
          <Icon name="stories" size={40} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>Nie udało się wczytać bajek</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
            Sprawdź internet i przeciągnij ekran w dół, żeby spróbować ponownie.
          </Text>
        </View>
      )}

      {featured && (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            Na dziś
          </Text>
          <Pressable
            onPress={() => start(featured)}
            accessibilityRole="button"
            accessibilityLabel={`Słuchaj: ${featured.title}, ${formatMinutes(featured.durationSec)}`}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderCurve: 'continuous',
              padding: spacing.md,
              gap: 14,
              opacity: pressed ? 0.85 : 1,
            })}>
            <Cover color={featured.coverColor} width="100%" height={150} radius={16} iconSize={64} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.text, fontSize: 19, fontWeight: '800' }}>{featured.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{formatMinutes(featured.durationSec)}</Text>
              </View>
              <View
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="play" color={colors.onAccent} size={28} />
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {stories.length > 0 && (
        <View style={{ gap: spacing.xs }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Wszystkie bajki
          </Text>
          {stories.map((s) => (
            <StoryRow key={s.id} story={s} action="download" onPress={() => start(s)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
