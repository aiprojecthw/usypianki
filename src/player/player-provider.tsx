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
import { useSettings } from '@/data/settings-provider';
import { isBundled, type Story } from '@/data/types';
import { resumePosition, type SleepMode } from '@/logic/resume';
import { bundledAudio } from '@/ui/media';

export type { SleepMode };

const FADE_SECONDS = 60;
const SAVE_EVERY_SECONDS = 5;

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
  /** Czy wyłącznik minutowy odlicza (dla trybu „Po tej bajce” zawsze false). */
  timerActive: boolean;
  /** Sekundy do zatrzymania: do końca bajki albo do końca wyłącznika. */
  secondsLeft: number;
  play: (story: Story) => void;
  toggle: () => void;
  pause: () => void;
  seekBy: (seconds: number) => void;
  setSleepMode: (mode: SleepMode) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 1000 });
  const status = useAudioPlayerStatus(player);
  const { localUri } = useDownloads();
  const { settings, savePosition } = useSettings();

  const [story, setStory] = useState<Story>();
  const [sleepMode, setSleepModeState] = useState<SleepMode>(settings.defaultSleep);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const notificationsAsked = useRef(false);
  const lastSaved = useRef(0);
  /** Miejsce wznowienia ustawiane dopiero, gdy nagranie się wczyta. */
  const pendingSeek = useRef(0);

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
      const downloadedUri = localUri(next.id);
      const source: AudioSource = downloadedUri
        ? { uri: downloadedUri }
        : isBundled(next)
          ? bundledAudio[next.id]
          : { uri: next.audioUrl };

      const startAt = resumePosition(settings.positions[next.id], next.durationSec);
      startPlayback(player, source, next);
      setStory(next);
      lastSaved.current = startAt;
      pendingSeek.current = startAt;

      // Każda nowa bajka startuje z domyślnym wyłącznikiem ustawionym przez rodzica.
      const mode = settings.defaultSleep;
      setSleepModeState(mode);
      setTimerEndsAt(typeof mode === 'number' ? Date.now() + mode * 60_000 : null);

      // Android 13+: bez zgody na powiadomienia nie pokaże się sterowanie w zasłonce.
      if (Platform.OS === 'android' && !notificationsAsked.current) {
        notificationsAsked.current = true;
        requestNotificationPermissionsAsync().catch(() => {});
      }
    },
    [player, localUri, settings.positions, settings.defaultSleep]
  );

  const pause = useCallback(() => {
    player.pause();
    if (story) savePosition(story.id, status.currentTime);
  }, [player, story, savePosition, status.currentTime]);

  const toggle = useCallback(() => {
    if (!story) return;
    if (status.playing) {
      pause();
    } else {
      resume(player, status.didJustFinish || status.currentTime >= status.duration - 0.5);
    }
  }, [player, story, pause, status.playing, status.didJustFinish, status.currentTime, status.duration]);

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

  useEffect(() => {
    if (!status.isLoaded || pendingSeek.current <= 0) return;
    const target = pendingSeek.current;
    pendingSeek.current = 0;
    player.seekTo(target).catch(() => {});
  }, [player, status.isLoaded]);

  // Zapamiętywanie miejsca co kilka sekund, żeby wrócić do bajki po przerwie.
  useEffect(() => {
    if (!story || !status.playing) return;
    if (Math.abs(status.currentTime - lastSaved.current) >= SAVE_EVERY_SECONDS) {
      lastSaved.current = status.currentTime;
      savePosition(story.id, status.currentTime);
    }
  }, [story, status.playing, status.currentTime, savePosition]);

  const timerActive = sleepMode !== 'end' && timerEndsAt !== null;
  const storyLeft = Math.max(0, (status.duration || story?.durationSec || 0) - status.currentTime);
  const secondsLeft = timerActive && timerEndsAt ? Math.max(0, (timerEndsAt - now) / 1000) : storyLeft;
  // Do wyciszenia liczy się to, co nastąpi wcześniej: koniec bajki czy koniec wyłącznika.
  const secondsToSilence = Math.min(storyLeft, secondsLeft);

  // Stopniowe ściszanie przez ostatnią minutę.
  useEffect(() => {
    if (!status.playing || status.duration <= 0) return;
    const fade = settings.fadeOut && secondsToSilence < FADE_SECONDS;
    setVolume(player, fade ? Math.max(0.05, secondsToSilence / FADE_SECONDS) : 1);
  }, [player, status.playing, status.duration, secondsToSilence, settings.fadeOut]);

  // Bez autoodtwarzania: po końcu bajki zostaje cisza, a następnym razem start od początku.
  useEffect(() => {
    if (!status.didJustFinish) return;
    setVolume(player, 1);
    if (story) savePosition(story.id, 0);
  }, [player, status.didJustFinish, story, savePosition]);

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
        timerActive,
        secondsLeft,
        play,
        toggle,
        pause,
        seekBy,
        setSleepMode,
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
