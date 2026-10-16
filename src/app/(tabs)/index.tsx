import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { HedgehogIntro } from '@/components/hedgehog-intro';
import { Txt } from '@/components/txt';
import { useDaypartNavBar, usePalette } from '@/components/ui';
import { useIsOffline, useStartStory } from '@/components/use-start-story';
import { useCatalog } from '@/data/catalog-provider';
import { useSettings } from '@/data/settings-provider';
import type { Story } from '@/data/types';
import { greetingFor } from '@/logic/daypart';
import { formatMinutes } from '@/theme';
import { playButtons, uiIcons, wallpapers } from '@/ui/media';

/** Ile bajek pokazuje karuzela; reszta jest na ekranie „Wszystkie bajki”. */
const CAROUSEL_LIMIT = 10;
const TILE_WIDTH = 104;

function SectionTitle({ children, color }: { children: string; color: string }) {
  return (
    <Txt weight="extrabold" size={13} color={color} style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
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
        width: TILE_WIDTH,
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 7,
        gap: 4,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Cover story={story} width="100%" height={64} radius={11} placeholderColor={palette.coverPlaceholder} />
      <Txt weight="bold" size={13} color={palette.text} numberOfLines={2} style={{ minHeight: 35 }}>
        {story.title}
      </Txt>
      <Txt size={11} color={palette.textMuted}>
        {formatMinutes(story.durationSec)}
      </Txt>
    </Pressable>
  );
}

/** Ostatni kafelek karuzeli: prowadzi do pełnej listy. */
function AllStoriesTile() {
  const palette = usePalette();
  return (
    <Pressable
      onPress={() => router.push('/stories')}
      accessibilityRole="button"
      accessibilityLabel="Wszystkie bajki"
      style={({ pressed }) => ({
        width: TILE_WIDTH,
        backgroundColor: palette.card,
        borderRadius: 16,
        padding: 7,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Image source={uiIcons.book} style={{ width: 44, height: 44 }} contentFit="contain" />
      <Txt weight="bold" size={13} color={palette.text} style={{ textAlign: 'center' }}>
        Wszystkie bajki →
      </Txt>
    </Pressable>
  );
}

export default function HomeScreen() {
  useDaypartNavBar();
  const insets = useSafeAreaInsets();
  const { daypart } = useSettings();
  const palette = usePalette();
  const { stories, featured, loading, refresh } = useCatalog();
  const start = useStartStory();
  const offline = useIsOffline();
  const { hello, subtitle } = greetingFor(daypart);
  const shadow = { textShadowColor: palette.textShadow, textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } };

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

      {/* Treść zaczyna się pod paskiem stanu i nie przewija się pod godziną. */}
      <ScrollView
        style={{ flex: 1, marginTop: insets.top }}
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={palette.accent} />}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={15} color={palette.textMuted} style={shadow}>
              {hello}
            </Txt>
            <Txt weight="extrabold" size={30} color={palette.text} accessibilityRole="header" style={[shadow, { lineHeight: 36 }]}>
              Usypianki
            </Txt>
            <Txt size={15} color={palette.textMuted} style={shadow}>
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
          <View style={{ gap: 8 }}>
            <SectionTitle color={palette.textMuted}>Bajka na dziś</SectionTitle>
            <Pressable
              onPress={() => start(featured)}
              accessibilityRole="button"
              accessibilityLabel={`Słuchaj: ${featured.title}, ${formatMinutes(featured.durationSec)}`}
              style={({ pressed }) => ({
                backgroundColor: palette.card,
                borderRadius: 20,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Cover story={featured} width={64} height={64} radius={14} placeholderColor={palette.coverPlaceholder} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight="extrabold" size={17} color={palette.text} numberOfLines={2}>
                  {featured.title}
                </Txt>
                <Txt size={13} color={palette.textMuted}>
                  {[formatMinutes(featured.durationSec), featured.ageLabel].filter(Boolean).join(' · ')}
                </Txt>
              </View>
              <Image source={playButtons[daypart]} style={{ width: 60, height: 60 }} contentFit="contain" />
            </Pressable>
          </View>
        )}

        {stories.length > 0 && (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <SectionTitle color={palette.textMuted}>Wszystkie bajki</SectionTitle>
              <Pressable onPress={() => router.push('/stories')} accessibilityRole="link" hitSlop={10} style={{ minHeight: 32, justifyContent: 'center' }}>
                <Txt weight="bold" size={14} color={palette.accent} style={shadow}>
                  Zobacz wszystkie
                </Txt>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              style={{ marginRight: -20 }}>
              {stories.slice(0, CAROUSEL_LIMIT).map((s) => (
                <StoryTile key={s.id} story={s} onPress={() => start(s)} />
              ))}
              <AllStoriesTile />
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
