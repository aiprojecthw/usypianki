import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import type { Daypart } from '@/logic/daypart';
import { wallpaperAnimations } from '@/ui/media';

/**
 * Tempo animacji jeżyka. Klip trwa ~5,2 s; 1 = naturalne tempo.
 * Do ustalenia po testach na telefonie (np. 1.5–2 skraca do 2,5–3,5 s).
 */
export const INTRO_PLAYBACK_RATE = 1;

/** Długość klipu w sekundach (wszystkie trzy animacje: 124 klatki przy 24 kl./s). */
const CLIP_SECONDS = 5.17;
/** Pauza tyle sekund przed końcem — jeżyk już się nie rusza, a odtwarzacz nie dochodzi do końca. */
const STOP_BEFORE_END = 0.25;

// Animacja leci raz na uruchomienie aplikacji, nie przy każdym powrocie na ekran.
let playedThisLaunch = false;

/**
 * Jednorazowa animacja jeżyka nałożona na tapetę. Ostatnie klatki klipu są
 * identyczne z tapetą, więc warstwę można schować bez żadnego przejścia.
 *
 * Bez zanikania: na Androidzie półprzezroczysta warstwa wideo odsłania czerń
 * zamiast tapety (potwierdzone nagraniem ekranu). Dlatego:
 * - warstwa jest widoczna dopiero po wyrenderowaniu pierwszej klatki,
 * - zegar aplikacji (nie zdarzenia odtwarzacza) zatrzymuje klip pauzą tuż
 *   przed końcem, na nieruchomej klatce, i od razu usuwa warstwę.
 * Bez dźwięku i bez blokowania dotyku: bajki są klikalne od pierwszej chwili.
 */
export function HedgehogIntro({ daypart }: { daypart: Daypart }) {
  const [visible, setVisible] = useState(!playedThisLaunch);
  const [started, setStarted] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Start zegara liczony od pierwszej wyrenderowanej klatki.
  useEffect(() => {
    if (!started) return;
    const ms = ((CLIP_SECONDS - STOP_BEFORE_END) / INTRO_PLAYBACK_RATE) * 1000;
    stopTimer.current = setTimeout(() => {
      try {
        player.pause();
      } catch {
        // Odtwarzacz mógł już zostać zwolniony — i tak chowamy warstwę.
      }
      setVisible(false);
    }, ms);
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, [started, player]);

  // Zabezpieczenie: gdyby klip się w ogóle nie odtworzył, warstwa i tak zniknie.
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setVisible(false), (CLIP_SECONDS / INTRO_PLAYBACK_RATE) * 1000 + 3000);
    return () => clearTimeout(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <VideoView
      player={player}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity: started ? 1 : 0 }]}
      contentFit="cover"
      nativeControls={false}
      surfaceType="textureView"
      accessible={false}
      onFirstFrameRender={() => setStarted(true)}
    />
  );
}
