import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { HedgehogIntro } from '@/components/hedgehog-intro';
import { Txt } from '@/components/txt';
import { usePalette } from '@/components/ui';
import { useIsOffline, useStartStory } from '@/components/use-start-story';
import { useCatalog } from '@/data/catalog-provider';
import { useSettings } from '@/data/settings-provider';
import type { Story } from '@/data/types';
import { greetingFor } from '@/logic/daypart';
import { formatMinutes } from '@/theme';
import { playButtons, uiIcons, wallpapers } from '@/ui/media';

function SectionTitle({ children, color }: { children: string; color: string }) {
  return (
    <Txt weight="extrabold" size={14} color={color} style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
      {children}
    </Txt>
  );
}

function StoryTile({ story, onPress }: { story: Story; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Słuchaj: ${story.title}, ${formatMinutes(story.durationSec)}`}
      style={({ pressed }) => ({
        width: 116,
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 8,
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Cover story={story} width="100%" height={80} radius={12} placeholderColor={palette.coverPlaceholder} />
      <Txt weight="bold" size={13} color={palette.text} numberOfLines={3}>
        {story.title}
      </Txt>
      <Txt size={12} color={palette.textMuted}>
        {formatMinutes(story.durationSec)}
      </Txt>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { daypart } = useSettings();
  const palette = usePalette();
  const { stories, featured, loading, isTestData, refresh } = useCatalog();
  const start = useStartStory();
  const offline = useIsOffline();
  const { hello, subtitle } = greetingFor(daypart);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Image
        source={wallpapers[daypart]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="bottom"
        accessibilityIgnoresInvertColors
      />
      <HedgehogIntro daypart={daypart} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 24, gap: 18 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={palette.accent} />}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={15} color={palette.textMuted}>
              {hello}
            </Txt>
            <Txt weight="extrabold" size={30} color={palette.text} accessibilityRole="header">
              Usypianki
            </Txt>
            <Txt size={15} color={palette.textMuted}>
              {subtitle}
            </Txt>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/gate', params: { next: 'parent' } })}
            accessibilityRole="button"
            accessibilityLabel="Strefa rodzica"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Image source={uiIcons.lock} style={{ width: 30, height: 30 }} contentFit="contain" />
          </Pressable>
        </View>

        {isTestData && (
          <Txt size={13} color={palette.textMuted} style={{ backgroundColor: palette.card, padding: 10, borderRadius: 14 }}>
            Wersja testowa: 4 krótkie bajki czytane syntezatorem mowy.
          </Txt>
        )}

        {offline && (
          <Txt size={13} color={palette.text} style={{ backgroundColor: palette.card, padding: 10, borderRadius: 14 }}>
            Brak internetu. Działają bajki z zakładki „Pobrane”.
          </Txt>
        )}

        {loading && stories.length === 0 && <ActivityIndicator color={palette.accent} style={{ marginTop: 32 }} />}

        {!loading && stories.length === 0 && (
          <View style={{ backgroundColor: palette.card, borderRadius: 22, padding: 16, gap: 4 }}>
            <Txt weight="bold" size={17} color={palette.text}>
              Nie udało się wczytać bajek
            </Txt>
            <Txt size={14} color={palette.textMuted}>
              Sprawdź internet i przeciągnij ekran w dół, żeby spróbować ponownie.
            </Txt>
          </View>
        )}

        {featured && (
          <View style={{ gap: 10 }}>
            <SectionTitle color={palette.textMuted}>Bajka na dziś</SectionTitle>
            <Pressable
              onPress={() => start(featured)}
              accessibilityRole="button"
              accessibilityLabel={`Słuchaj: ${featured.title}, ${formatMinutes(featured.durationSec)}`}
              style={({ pressed }) => ({
                backgroundColor: palette.card,
                borderRadius: 22,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Cover story={featured} width={72} height={72} radius={16} placeholderColor={palette.coverPlaceholder} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight="extrabold" size={18} color={palette.text}>
                  {featured.title}
                </Txt>
                <Txt size={14} color={palette.textMuted}>
                  {[formatMinutes(featured.durationSec), featured.ageLabel].filter(Boolean).join(' · ')}
                </Txt>
              </View>
              <Image source={playButtons[daypart]} style={{ width: 64, height: 64 }} contentFit="contain" />
            </Pressable>
          </View>
        )}

        {stories.length > 0 && (
          <View style={{ gap: 10 }}>
            <SectionTitle color={palette.textMuted}>Wszystkie bajki</SectionTitle>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              style={{ marginRight: -20 }}>
              {stories.map((s) => (
                <StoryTile key={s.id} story={s} onPress={() => start(s)} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
