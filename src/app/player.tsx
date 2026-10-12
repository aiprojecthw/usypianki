import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { Icon } from '@/components/icon';
import { usePlayer } from '@/player/player-provider';
import { colors, formatDuration, spacing } from '@/theme';

function sleepLabel(mode: ReturnType<typeof usePlayer>['sleepMode'], secondsLeft: number): string {
  if (mode === 'end') return 'Po tej bajce';
  return `Za ${Math.max(1, Math.ceil(secondsLeft / 60))} min`;
}

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { story, playing, isBuffering, currentTime, duration, hasError, sleepMode, secondsLeft, toggle, seekBy } =
    usePlayer();

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }}>
      <View style={{ height: 64, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Wróć do biblioteki"
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Teraz gra</Text>
      </View>

      {!story ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center' }}>Wybierz bajkę z biblioteki.</Text>
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 28, alignItems: 'center', gap: 26 }}>
          <Cover story={story} width={280} height={280} radius={28} iconSize={120} />

          <View style={{ width: '100%', gap: 6 }}>
            <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 23, fontWeight: '800', textAlign: 'center' }}>
              {story.title}
            </Text>
            {hasError && (
              <Text style={{ color: colors.warningText, fontSize: 14, textAlign: 'center' }}>
                Nie udało się odtworzyć. Sprawdź internet albo pobierz bajkę.
              </Text>
            )}
          </View>

          <View
            style={{ width: '100%', gap: spacing.sm }}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Postęp: ${formatDuration(currentTime)} z ${formatDuration(duration)}`}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' }}>
              <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: colors.accent }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{formatDuration(currentTime)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{formatDuration(duration)}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 36 }}>
            <Pressable
              onPress={() => seekBy(-10)}
              accessibilityRole="button"
              accessibilityLabel="Cofnij 10 sekund"
              style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="back10" size={30} />
            </Pressable>
            <Pressable
              onPress={toggle}
              accessibilityRole="button"
              accessibilityLabel={playing ? 'Pauza' : 'Odtwórz'}
              style={({ pressed }) => ({
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}>
              {isBuffering && !playing ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Icon name={playing ? 'pause' : 'play'} size={38} color={colors.onAccent} />
              )}
            </Pressable>
            <Pressable
              onPress={() => seekBy(10)}
              accessibilityRole="button"
              accessibilityLabel="Przewiń 10 sekund"
              style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="forward10" size={30} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto' }}>
            <Link href="/timer" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Wyłącznik czasowy: ${sleepLabel(sleepMode, secondsLeft)}`}
                style={{ height: 48, paddingHorizontal: spacing.md, borderRadius: 24, backgroundColor: colors.surfaceRaised, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Icon name="timer" size={18} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{sleepLabel(sleepMode, secondsLeft)}</Text>
              </Pressable>
            </Link>
            <Link href="/night" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Wygaś ekran"
                style={{ height: 48, paddingHorizontal: spacing.md, borderRadius: 24, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Icon name="moon" size={18} />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>Wygaś ekran</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      )}
    </View>
  );
}
