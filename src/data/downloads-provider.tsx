import { Directory, File, Paths } from 'expo-file-system';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { BUNDLED_TEST_AUDIO, type Story } from './types';

const storiesDir = new Directory(Paths.document, 'stories');

function fileFor(id: string): File {
  return new File(storiesDir, `${id}.mp3`);
}

function scanDownloaded(): Record<string, number> {
  const result: Record<string, number> = {};
  try {
    if (!storiesDir.exists) return result;
    for (const entry of storiesDir.list()) {
      if (entry instanceof File && entry.name.endsWith('.mp3')) {
        result[entry.name.replace(/\.mp3$/, '')] = entry.size;
      }
    }
  } catch {
    // Pusty wynik: traktujemy jak brak pobranych bajek.
  }
  return result;
}

type DownloadsState = {
  /** id bajki → rozmiar pliku w bajtach */
  downloaded: Record<string, number>;
  downloading: Record<string, boolean>;
  isDownloaded: (id: string) => boolean;
  /** Lokalny adres pliku, jeśli bajka jest pobrana. */
  localUri: (id: string) => string | undefined;
  download: (story: Story) => Promise<void>;
  remove: (id: string) => void;
};

const DownloadsContext = createContext<DownloadsState | null>(null);

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [downloaded, setDownloaded] = useState<Record<string, number>>(scanDownloaded);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const isDownloaded = useCallback((id: string) => id in downloaded, [downloaded]);

  const localUri = useCallback(
    (id: string) => (id in downloaded ? fileFor(id).uri : undefined),
    [downloaded]
  );

  const download = useCallback(async (story: Story) => {
    // Plik testowy jest już w aplikacji, nie ma czego pobierać.
    if (story.audioUrl === BUNDLED_TEST_AUDIO) return;
    setDownloading((d) => ({ ...d, [story.id]: true }));
    const target = fileFor(story.id);
    try {
      storiesDir.create({ idempotent: true, intermediates: true });
      await File.downloadFileAsync(story.audioUrl, target, { idempotent: true });
      setDownloaded((d) => ({ ...d, [story.id]: target.size }));
    } catch (error) {
      // Nie zostawiamy uszkodzonego, częściowo pobranego pliku.
      try {
        if (target.exists) target.delete();
      } catch {}
      throw error;
    } finally {
      setDownloading((d) => {
        const next = { ...d };
        delete next[story.id];
        return next;
      });
    }
  }, []);

  const remove = useCallback((id: string) => {
    try {
      const file = fileFor(id);
      if (file.exists) file.delete();
    } catch {}
    setDownloaded((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <DownloadsContext value={{ downloaded, downloading, isDownloaded, localUri, download, remove }}>
      {children}
    </DownloadsContext>
  );
}

export function useDownloads(): DownloadsState {
  const value = use(DownloadsContext);
  if (!value) throw new Error('useDownloads must be used inside DownloadsProvider');
  return value;
}
