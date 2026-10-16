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
import { resumePosition, type AfterStory } from '@/logic/resume';
import { bundledAudio, afterStoryMelody } from '@/ui/media';

export type { AfterStory };

const SAVE_EVERY_SECONDS = 5;

// Zmiany na natywnym odtwarzaczu robimy przez funkcje spoza komponentu,
// bo React Compiler nie pozwala modyfikować wartości zwróconych z hooków.
function startPlayback(player: AudioPlayer, source: AudioSource, title: string) {
  player.volume = 1;
  player.replace(source);
  player.play();
  player.setActiveForLockScreen(
    true,
    { title, artist: 'Usypianki' },
    { showSeekBackward: true, showSeekForward: true }
  );
}

function stopPlayer(player: AudioPlayer) {
  player.pause();
  player.seekTo(0).catch(() => {});
}

function resume(player: AudioPlayer, restart: boolean) {
  if (restart) player.seekTo(0).catch(() => {});
  player.volume = 1;
  player.play();
}

type PlayerState = {
  story: Story | undefined;
  playing: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  hasError: boolean;
  /** Co po bajce (zapamiętane w ustawieniach). */
  afterStory: AfterStory;
  setAfterStory: (mode: AfterStory) => void;
  /** Czy właśnie gra melodia po bajce. */
  melodyPlaying: boolean;
  /** Sekundy do końca bajki albo — gdy gra melodia — do jej wyciszenia. */
  secondsLeft: number;
  play: (story: Story) => void;
  toggle: () => void;
  pause: () => void;
  stopMelody: () => void;
  seekBy: (seconds: number) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 1000 });
  const status = useAudioPlayerStatus(player);
  // Melodia to osobny plik 10 min z wbudowanym wejściem i wyciszeniem —
  // nie zależy od zegarów w aplikacji, więc działa też przy zgaszonym ekranie.
  const melody = useAudioPlayer(afterStoryMelody, { updateInterval: 1000 });
  const melodyStatus = useAudioPlayerStatus(melody);
  const { localUri } = useDownloads();
  const { settings, update, savePosition } = useSettings();

  const [story, setStory] = useState<Story>();
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

  const stopMelody = useCallback(() => {
    stopPlayer(melody);
  }, [melody]);

  const play = useCallback(
    (next: Story) => {
      stopMelody();
      const downloadedUri = localUri(next.id);
      const source: AudioSource = downloadedUri
        ? { uri: downloadedUri }
        : isBundled(next)
          ? bundledAudio[next.id]
          : { uri: next.audioUrl };

      const startAt = resumePosition(settings.positions[next.id], next.durationSec);
      startPlayback(player, source, next.title);
      setStory(next);
      lastSaved.current = startAt;
      pendingSeek.current = startAt;

      // Android 13+: bez zgody na powiadomienia nie pokaże się sterowanie w zasłonce.
      if (Platform.OS === 'android' && !notificationsAsked.current) {
        notificationsAsked.current = true;
        requestNotificationPermissionsAsync().catch(() => {});
      }
    },
    [player, localUri, settings.positions, stopMelody]
  );

  const pause = useCallback(() => {
    player.pause();
    if (story) savePosition(story.id, status.currentTime);
  }, [player, story, savePosition, status.currentTime]);

  const toggle = useCallback(() => {
    if (!story) return;
    if (melodyStatus.playing) {
      stopMelody();
      return;
    }
    if (status.playing) {
      pause();
    } else {
      resume(player, status.didJustFinish || status.currentTime >= status.duration - 0.5);
    }
  }, [player, story, pause, stopMelody, melodyStatus.playing, status.playing, status.didJustFinish, status.currentTime, status.duration]);

  const seekBy = useCallback(
    (seconds: number) => {
      const target = Math.min(Math.max(0, status.currentTime + seconds), Math.max(0, status.duration - 1));
      player.seekTo(target).catch(() => {});
    },
    [player, status.currentTime, status.duration]
  );

  const setAfterStory = useCallback(
    (mode: AfterStory) => {
      update({ afterStory: mode });
      if (mode === 'silence') stopMelody();
    },
    [update, stopMelody]
  );

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

  // Koniec bajki: zapisujemy start od początku i — jeśli wybrano — włączamy melodię.
  // Bajka nigdy nie jest ściszana; kolejna bajka nie włącza się sama.
  useEffect(() => {
    if (!status.didJustFinish) return;
    if (story) savePosition(story.id, 0);
    if (settings.afterStory === 'melody') {
      startPlayback(melody, afterStoryMelody, 'Spokojna melodia');
    }
  }, [status.didJustFinish, story, savePosition, settings.afterStory, melody]);

  const storyLeft = Math.max(0, (status.duration || story?.durationSec || 0) - status.currentTime);
  const melodyLeft = Math.max(0, melodyStatus.duration - melodyStatus.currentTime);

  return (
    <PlayerContext
      value={{
        story,
        playing: status.playing || melodyStatus.playing,
        isBuffering: status.isBuffering,
        currentTime: status.currentTime,
        duration: status.duration || story?.durationSec || 0,
        hasError: Boolean((status as { error?: unknown }).error),
        afterStory: settings.afterStory,
        setAfterStory,
        melodyPlaying: melodyStatus.playing,
        secondsLeft: melodyStatus.playing ? melodyLeft : storyLeft,
        play,
        toggle,
        pause,
        stopMelody,
        seekBy,
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
