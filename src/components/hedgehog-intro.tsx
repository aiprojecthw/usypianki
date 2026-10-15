import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import type { Daypart } from '@/logic/daypart';
import { wallpaperAnimations } from '@/ui/media';

/**
 * Tempo animacji jeżyka. Klip trwa 5 s; 1 = naturalne tempo.
 * Do ustalenia po testach na telefonie (np. 1.5–2 skraca do 2,5–3,5 s).
 */
export const INTRO_PLAYBACK_RATE = 1;

// Animacja leci raz na uruchomienie aplikacji, nie przy każdym powrocie na ekran.
let playedThisLaunch = false;

/**
 * Jednorazowa animacja jeżyka nałożona na tapetę. Ostatnia klatka klipu jest
 * identyczna z tapetą, więc po zakończeniu warstwa wideo po prostu znika.
 * Bez dźwięku i bez blokowania dotyku: bajki są klikalne od pierwszej chwili.
 */
export function HedgehogIntro({ daypart }: { daypart: Daypart }) {
  const [visible, setVisible] = useState(!playedThisLaunch);
  const [opacity] = useState(() => new Animated.Value(1));

  const player = useVideoPlayer(visible ? wallpaperAnimations[daypart] : null, (p) => {
    p.muted = true;
    p.loop = false;
    p.audioMixingMode = 'mixWithOthers';
    p.playbackRate = INTRO_PLAYBACK_RATE;
    p.play();
  });

  useEffect(() => {
    playedThisLaunch = true;
  }, []);

  useEventListener(player, 'playToEnd', () => {
    Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setVisible(false));
  });

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
      />
    </Animated.View>
  );
}
