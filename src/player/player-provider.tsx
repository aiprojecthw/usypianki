import {
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useDownloads } from '@/data/downloads-provider';
import { BUNDLED_TEST_AUDIO, type Story } from '@/data/types';

const testAudio = require('../../assets/audio/test.mp3');

/** 'end' = zatrzymaj po bieżącej bajce; liczba = zatrzymaj po tylu minutach. */
export type SleepMode = 'end' | 10 | 20 | 30;

const FADE_SECONDS = 60;

// Zmiany na natywnym odtwarzaczu robimy przez funkcje spoza komponentu,
// bo React Compiler nie pozwala modyfikować wartości zwróconych z hooków.
function setVolume(player: AudioPlayer, value: number) {
  player.volume = value;
}

function startPlayback(player: AudioPlayer, source: AudioSource, story: Story) {
  player.volume = 1;
  player.replace(source);
  player.play();
  player.setActiveForLockScreen(
    true,
    { title: story.title, artist: 'Usypianki' },
    { showSeekBackward: true, showSeekForward: true }
  );
}

function resume(player: AudioPlayer, restart: boolean) {
  if (restart) player.seekTo(0).catch(() => {});
  player.volume = 1;
  player.play();
}

function stopForSleep(player: AudioPlayer) {
  player.pause();
  player.volume = 1;
}

type PlayerState = {
  story: Story | undefined;
  playing: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  hasError: boolean;
  sleepMode: SleepMode;
  fadeOut: boolean;
  /** Sekundy do zatrzymania przez wyłącznik czasowy. */
  secondsLeft: number;
  play: (story: Story) => void;
  toggle: () => void;
  seekBy: (seconds: number) => void;
  setSleepMode: (mode: SleepMode) => void;
  setFadeOut: (value: boolean) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 1000 });
  const status = useAudioPlayerStatus(player);
  const { localUri } = useDownloads();

  const [story, setStory] = useState<Story>();
  const [sleepMode, setSleepModeState] = useState<SleepMode>('end');
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [fadeOut, setFadeOut] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const notificationsAsked = useRef(false);

  useEffect(() => {
    // Odtwarzanie w tle i przy zgaszonym ekranie. 'doNotMix' jest wymagane
    // przez sterowanie z ekranu blokady, bez którego Android po ok. 3 min
    // zatrzymuje dźwięk w tle.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  const play = useCallback(
    (next: Story) => {
      const source: AudioSource =
        next.audioUrl === BUNDLED_TEST_AUDIO ? testAudio : { uri: localUri(next.id) ?? next.audioUrl };

      startPlayback(player, source, next);
      setStory(next);
      if (typeof sleepMode === 'number') setTimerEndsAt(Date.now() + sleepMode * 60_000);

      // Android 13+: bez zgody na powiadomienia nie pokaże się sterowanie w zasłonce.
      if (Platform.OS === 'android' && !notificationsAsked.current) {
        notificationsAsked.current = true;
        requestNotificationPermissionsAsync().catch(() => {});
      }
    },
    [player, localUri, sleepMode]
  );

  const toggle = useCallback(() => {
    if (!story) return;
    if (status.playing) {
      player.pause();
    } else {
      resume(player, status.didJustFinish || status.currentTime >= status.duration - 0.5);
    }
  }, [player, story, status.playing, status.didJustFinish, status.currentTime, status.duration]);

  const seekBy = useCallback(
    (seconds: number) => {
      const target = Math.min(Math.max(0, status.currentTime + seconds), Math.max(0, status.duration - 1));
      player.seekTo(target).catch(() => {});
    },
    [player, status.currentTime, status.duration]
  );

  const setSleepMode = useCallback((mode: SleepMode) => {
    setSleepModeState(mode);
    setTimerEndsAt(typeof mode === 'number' ? Date.now() + mode * 60_000 : null);
  }, []);

  // Zegar wyłącznika, tylko gdy coś gra. Po upływie czasu zatrzymuje bajkę.
  useEffect(() => {
    if (!status.playing) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (timerEndsAt !== null && t >= timerEndsAt) {
        stopForSleep(player);
        setTimerEndsAt(null);
        setSleepModeState('end');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status.playing, timerEndsAt, player]);

  const secondsLeft =
    sleepMode === 'end'
      ? Math.max(0, status.duration - status.currentTime)
      : timerEndsAt
        ? Math.max(0, (timerEndsAt - now) / 1000)
        : 0;

  // Stopniowe ściszanie przez ostatnią minutę.
  useEffect(() => {
    if (!status.playing || status.duration <= 0) return;
    setVolume(player, fadeOut && secondsLeft < FADE_SECONDS ? Math.max(0.05, secondsLeft / FADE_SECONDS) : 1);
  }, [player, status.playing, status.duration, secondsLeft, fadeOut]);

  // Bez autoodtwarzania: po końcu bajki zostaje cisza.
  useEffect(() => {
    if (status.didJustFinish) setVolume(player, 1);
  }, [player, status.didJustFinish]);

  return (
    <PlayerContext
      value={{
        story,
        playing: status.playing,
        isBuffering: status.isBuffering,
        currentTime: status.currentTime,
        duration: status.duration || story?.durationSec || 0,
        hasError: Boolean((status as { error?: unknown }).error),
        sleepMode,
        fadeOut,
        secondsLeft,
        play,
        toggle,
        seekBy,
        setSleepMode,
        setFadeOut,
      }}>
      {children}
    </PlayerContext>
  );
}

export function usePlayer(): PlayerState {
  const value = use(PlayerContext);
  if (!value) throw new Error('usePlayer must be used inside PlayerProvider');
  return value;
}
