import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import type { Daypart } from '@/logic/daypart';
import { wallpaperAnimations } from '@/ui/media';

/**
 * Tempo animacji jeżyka. Klip trwa 5 s; 1 = naturalne tempo.
 * Do ustalenia po testach na telefonie (np. 1.5–2 skraca do 2,5–3,5 s).
 */
export const INTRO_PLAYBACK_RATE = 1;

/** Zanikanie zaczyna się tyle sekund przed końcem klipu (czas filmu, nie zegara). */
const FADE_BEFORE_END = 0.6;
const FADE_MS = 450;

// Animacja leci raz na uruchomienie aplikacji, nie przy każdym powrocie na ekran.
let playedThisLaunch = false;

/**
 * Jednorazowa animacja jeżyka nałożona na tapetę. Ostatnia klatka klipu jest
 * identyczna z tapetą, więc warstwa wideo może zniknąć, zanim klip się skończy.
 *
 * Odtwarzacz Androida po ostatniej klatce czyści obraz na czarno, dlatego:
 * - warstwa pojawia się dopiero po wyrenderowaniu pierwszej klatki,
 * - zanika przed końcem klipu, a nie po nim.
 * Bez dźwięku i bez blokowania dotyku: bajki są klikalne od pierwszej chwili.
 */
export function HedgehogIntro({ daypart }: { daypart: Daypart }) {
  const [visible, setVisible] = useState(!playedThisLaunch);
  const [opacity] = useState(() => new Animated.Value(0));
  const fading = useRef(false);

  const player = useVideoPlayer(visible ? wallpaperAnimations[daypart] : null, (p) => {
    p.muted = true;
    p.loop = false;
    p.audioMixingMode = 'mixWithOthers';
    p.playbackRate = INTRO_PLAYBACK_RATE;
    p.timeUpdateEventInterval = 0.1;
    p.play();
  });

  useEffect(() => {
    playedThisLaunch = true;
  }, []);

  const fadeOut = () => {
    if (fading.current) return;
    fading.current = true;
    Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => setVisible(false));
  };

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration;
    if (duration > 0 && currentTime >= duration - FADE_BEFORE_END) fadeOut();
  });

  // Gdyby zdarzenie czasu nie dotarło, koniec klipu i tak schowa warstwę.
  useEventListener(player, 'playToEnd', () => fadeOut());

  // Zabezpieczenie: gdyby klip się nie odtworzył, warstwa i tak zniknie.
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setVisible(false), (5 / INTRO_PLAYBACK_RATE) * 1000 + 3000);
    return () => clearTimeout(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
        accessible={false}
        onFirstFrameRender={() => opacity.setValue(1)}
      />
    </Animated.View>
  );
}
