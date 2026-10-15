import * as Brightness from 'expo-brightness';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { WoodenBackButton } from '@/components/ui';
import { usePlayer } from '@/player/player-provider';
import { formatMinutes, nightMode, palettes } from '@/theme';
import { skies, uiIcons } from '@/ui/media';

/** Docelowa jasność okna aplikacji w stanie przyciemnionym (nie 0 — widać zarys). */
const DIM_LEVEL = 0.1;
const FADE_MS = 3000;
const FADE_STEPS = 15;
/** Po dotknięciu: ile sekund ekran zostaje jasny ze sterowaniem. */
const BRIGHT_SECONDS = 10;

/**
 * Tryb nocny. Jasność zmieniamy tylko dla okna aplikacji (setBrightnessAsync),
 * nigdy systemowej — po wyjściu z aplikacji telefon wraca do swojej jasności.
 * Ekran nie jest trzymany włączony, więc telefon zgaśnie sam po czasie
 * ustawionym w systemie, a bajka gra dalej w tle.
 */
export default function NightScreen() {
  const insets = useSafeAreaInsets();
  const { story, playing, timerActive, secondsLeft, toggle, seekBy } = usePlayer();
  const [bright, setBright] = useState(false);
  const [countdown, setCountdown] = useState(BRIGHT_SECONDS);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const palette = palettes.night;

  const stopFade = () => {
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    fadeTimer.current = null;
  };

  const dimSlowly = useCallback(async () => {
    stopFade();
    let start = 1;
    try {
      start = await Brightness.getBrightnessAsync();
    } catch {}
    let step = 0;
    fadeTimer.current = setInterval(() => {
      step += 1;
      const value = start + ((DIM_LEVEL - start) * step) / FADE_STEPS;
      Brightness.setBrightnessAsync(Math.max(DIM_LEVEL, value)).catch(() => {});
      if (step >= FADE_STEPS) stopFade();
    }, FADE_MS / FADE_STEPS);
  }, []);

  const restore = useCallback(() => {
    stopFade();
    Brightness.restoreSystemBrightnessAsync().catch(() => {});
  }, []);

  // Wejście: płynne przyciemnienie. Wyjście z ekranu: przywrócenie jasności.
  useEffect(() => {
    dimSlowly();
    return () => restore();
  }, [dimSlowly, restore]);

  // Powrót z tła (np. po odblokowaniu telefonu): zawsze normalna jasność.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        restore();
        setBright(true);
        setCountdown(BRIGHT_SECONDS);
      } else {
        stopFade();
      }
    });
    return () => sub.remove();
  }, [restore]);

  // Odliczanie w stanie jasnym, potem znów ciemno.
  useEffect(() => {
    if (!bright) return;
    const id = setTimeout(() => {
      if (countdown <= 1) {
        setBright(false);
        dimSlowly();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [bright, countdown, dimSlowly]);

  const wake = () => {
    restore();
    setCountdown(BRIGHT_SECONDS);
    setBright(true);
  };

  const dimNow = () => {
    setBright(false);
    dimSlowly();
  };

  const timeLine = playing
    ? timerActive
      ? `Wyłącznik: ${formatMinutes(secondsLeft)} · potem cisza`
      : `Do końca bajki: ${formatMinutes(secondsLeft)}`
    : 'Wstrzymano';

  if (!bright) {
    return (
      <Pressable
        onPress={wake}
        accessibilityRole="button"
        accessibilityLabel="Dotknij, aby rozjaśnić ekran i pokazać sterowanie"
        style={{ flex: 1, backgroundColor: nightMode.background, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
        <Image source={uiIcons.moon} style={{ width: 30, height: 36, opacity: 0.35, marginBottom: 8 }} contentFit="contain" />
        {story && (
          <Txt weight="semibold" size={16} color={nightMode.title} style={{ textAlign: 'center' }}>
            {story.title}
          </Txt>
        )}
        <Txt size={15} color={nightMode.text}>
          {timeLine}
        </Txt>
        <Txt size={13} color={nightMode.hint} style={{ position: 'absolute', bottom: insets.bottom + 48 }}>
          Dotknij, aby rozjaśnić
        </Txt>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Image source={skies.night} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right top" />
      {/* Dotknięcie pustego miejsca od razu przyciemnia ekran. */}
      <Pressable onPress={dimNow} accessibilityLabel="Przyciemnij ekran teraz" style={StyleSheet.absoluteFill} />

      <View style={{ height: 64, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}>
        <WoodenBackButton label="Wyjdź z trybu nocnego" onPress={() => router.back()} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 32 }} pointerEvents="box-none">
        <View style={{ gap: 6 }} pointerEvents="none">
          <Txt weight="extrabold" size={23} color={palette.text} style={{ textAlign: 'center' }}>
            {story?.title ?? ''}
          </Txt>
          <Txt size={15} color={palette.textMuted} style={{ textAlign: 'center' }}>
            {timeLine}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 36 }}>
          <Pressable
            onPress={() => {
              seekBy(-15);
              setCountdown(BRIGHT_SECONDS);
            }}
            accessibilityRole="button"
            accessibilityLabel="Cofnij 15 sekund"
            style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="replay" size={28} color={palette.text} />
          </Pressable>
          <Pressable
            onPress={() => {
              toggle();
              setCountdown(BRIGHT_SECONDS);
            }}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pauza' : 'Odtwórz'}
            style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={playing ? 'pause' : 'play'} size={38} color={palette.onAccent} />
          </Pressable>
          <Pressable
            onPress={() => {
              seekBy(15);
              setCountdown(BRIGHT_SECONDS);
            }}
            accessibilityRole="button"
            accessibilityLabel="Przewiń 15 sekund"
            style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] }}>
            <Icon name="replay" size={28} color={palette.text} />
          </Pressable>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 10, paddingBottom: 40 }} pointerEvents="none">
        <View style={{ width: 160, height: 4, borderRadius: 2, backgroundColor: 'rgba(236,231,218,0.18)', overflow: 'hidden' }}>
          <View style={{ width: `${(countdown / BRIGHT_SECONDS) * 100}%`, height: 4, backgroundColor: palette.accent }} />
        </View>
        <Txt size={13} color={palette.textMuted}>
          Ekran przyciemni się za {countdown} s
        </Txt>
      </View>
    </View>
  );
}
