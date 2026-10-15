import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { goBack, SkyBackground, usePalette, WoodenBackButton } from '@/components/ui';
import { useDownloads } from '@/data/downloads-provider';
import { useSettings } from '@/data/settings-provider';
import { sleepLabel } from '@/logic/resume';
import { usePlayer } from '@/player/player-provider';
import { formatDuration } from '@/theme';
import { uiIcons } from '@/ui/media';

const SEEK_SECONDS = 15;

/** „Pobierz”: przed zakupem prowadzi przez bramkę do Strefy rodzica, po zakupie pobiera. */
function DownloadButton() {
  const palette = usePalette();
  const { settings } = useSettings();
  const { story } = usePlayer();
  const { isDownloaded, downloading, download } = useDownloads();
  const [error, setError] = useState(false);

  if (!story) return null;
  const done = isDownloaded(story.id);
  const busy = Boolean(downloading[story.id]);

  const onPress = () => {
    if (!settings.offlinePurchased) {
      router.push({ pathname: '/gate', params: { next: 'parent' } });
      return;
    }
    if (done || busy) return;
    setError(false);
    download(story).catch(() => {
      setError(true);
      Alert.alert('Nie udało się pobrać', 'Sprawdź połączenie z internetem i spróbuj jeszcze raz.');
    });
  };

  const label = done ? 'Pobrano' : busy ? 'Pobieram…' : error ? 'Spróbuj ponownie' : 'Pobierz';

  return (
    <Pressable
      onPress={onPress}
      disabled={done || busy}
      accessibilityRole="button"
      accessibilityLabel={done ? 'Bajka jest na telefonie' : 'Pobierz bajkę na telefon'}
      style={{
        marginLeft: 'auto',
        height: 44,
        paddingHorizontal: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.outline,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
      {busy ? (
        <ActivityIndicator color={palette.accent} size="small" />
      ) : done ? (
        <Icon name="done" color={palette.accent} size={22} />
      ) : (
        <Image source={uiIcons.basket} style={{ width: 24, height: 24 }} contentFit="contain" />
      )}
      <Txt weight="bold" size={14} color={palette.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

function SeekButton({ seconds, onPress }: { seconds: number; onPress: () => void }) {
  const palette = usePalette();
  const back = seconds < 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={back ? `Cofnij ${-seconds} sekund` : `Przewiń ${seconds} sekund`}
      style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: [{ scaleX: back ? 1 : -1 }] }}>
        <Icon name="replay" size={28} color={palette.text} />
      </View>
      <Txt weight="bold" size={11} color={palette.text} style={{ marginTop: -4 }}>
        {Math.abs(seconds)}
      </Txt>
    </Pressable>
  );
}

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { story, playing, isBuffering, currentTime, duration, hasError, sleepMode, timerActive, secondsLeft, toggle, seekBy } =
    usePlayer();

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const chip = {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  };

  return (
    <SkyBackground style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
      <View style={{ height: 64, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}>
        <WoodenBackButton label="Wróć do biblioteki" onPress={() => goBack('/')} />
        <DownloadButton />
      </View>

      {!story ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Txt size={15} color={palette.textMuted} style={{ textAlign: 'center' }}>
            Wybierz bajkę z biblioteki.
          </Txt>
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 8, alignItems: 'center', gap: 24 }}>
          <Cover story={story} width={280} height={280} radius={28} placeholderColor={palette.coverPlaceholder} />

          <View style={{ width: '100%', gap: 4 }}>
            <Txt weight="extrabold" size={23} color={palette.text} style={{ textAlign: 'center' }} accessibilityRole="header">
              {story.title}
            </Txt>
            {hasError && (
              <Txt size={14} color={palette.textMuted} style={{ textAlign: 'center' }}>
                Nie udało się odtworzyć. Sprawdź internet albo pobierz bajkę.
              </Txt>
            )}
          </View>

          <View
            style={{ width: '100%', gap: 8 }}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Postęp: ${formatDuration(currentTime)} z ${formatDuration(duration)}`}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.progressTrack }}>
              <View style={{ width: `${progress * 100}%`, height: 6, borderRadius: 3, backgroundColor: palette.accent }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={13} color={palette.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
                {formatDuration(currentTime)}
              </Txt>
              <Txt size={13} color={palette.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
                {formatDuration(duration)}
              </Txt>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 36 }}>
            <SeekButton seconds={-SEEK_SECONDS} onPress={() => seekBy(-SEEK_SECONDS)} />
            <Pressable
              onPress={toggle}
              accessibilityRole="button"
              accessibilityLabel={playing ? 'Pauza' : 'Odtwórz'}
              style={({ pressed }) => ({
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: palette.accent,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}>
              {isBuffering && !playing ? (
                <ActivityIndicator color={palette.onAccent} />
              ) : (
                <Icon name={playing ? 'pause' : 'play'} size={38} color={palette.onAccent} />
              )}
            </Pressable>
            <SeekButton seconds={SEEK_SECONDS} onPress={() => seekBy(SEEK_SECONDS)} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto' }}>
            <Pressable
              onPress={() => router.push('/timer')}
              accessibilityRole="button"
              accessibilityLabel={`Wyłącznik czasowy: ${sleepLabel(sleepMode, secondsLeft, timerActive)}`}
              style={[chip, { backgroundColor: palette.card }]}>
              <Image source={uiIcons.hourglass} style={{ width: 16, height: 24 }} contentFit="contain" />
              <Txt weight="bold" size={14} color={palette.text}>
                {sleepLabel(sleepMode, secondsLeft, timerActive)}
              </Txt>
            </Pressable>
            <Pressable
              onPress={() => router.push('/night')}
              accessibilityRole="button"
              accessibilityLabel="Wygaś ekran"
              style={[chip, { borderWidth: 1, borderColor: palette.outline }]}>
              <Image source={uiIcons.moon} style={{ width: 20, height: 24 }} contentFit="contain" />
              <Txt weight="bold" size={14} color={palette.text}>
                Wygaś ekran
              </Txt>
            </Pressable>
          </View>
        </View>
      )}
    </SkyBackground>
  );
}
