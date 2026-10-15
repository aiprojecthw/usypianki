import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { bundledAudio } from '@/ui/media';

import { isBundled, type Story } from './types';

const storiesDir = new Directory(Paths.document, 'stories');

function fileFor(id: string): File {
  return new File(storiesDir, `${id}.mp3`);
}

/** Folder pobranych bajek (testowe kopiujemy z aplikacji, prawdziwe ściągamy z R2). */
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
  removeAll: () => void;
  totalBytes: number;
};

const DownloadsContext = createContext<DownloadsState | null>(null);

async function bundledUri(id: string): Promise<string | undefined> {
  const moduleId = bundledAudio[id];
  if (moduleId === undefined) return undefined;
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
}

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [downloaded, setDownloaded] = useState<Record<string, number>>(scanDownloaded);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const isDownloaded = useCallback((id: string) => id in downloaded, [downloaded]);

  const localUri = useCallback((id: string) => (id in downloaded ? fileFor(id).uri : undefined), [downloaded]);

  const download = useCallback(async (story: Story) => {
    setDownloading((d) => ({ ...d, [story.id]: true }));
    const target = fileFor(story.id);
    try {
      storiesDir.create({ idempotent: true, intermediates: true });
      if (isBundled(story)) {
        // Bajka testowa: kopiujemy nagranie z aplikacji, żeby przetestować ekran „Pobrane”.
        const uri = await bundledUri(story.id);
        if (!uri) throw new Error('Brak nagrania testowego');
        if (target.exists) target.delete();
        new File(uri).copy(target);
      } else {
        await File.downloadFileAsync(story.audioUrl, target, { idempotent: true });
      }
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

  const removeAll = useCallback(() => {
    try {
      if (storiesDir.exists) storiesDir.delete();
    } catch {}
    setDownloaded({});
  }, []);

  const totalBytes = Object.values(downloaded).reduce((sum, b) => sum + b, 0);

  return (
    <DownloadsContext
      value={{ downloaded, downloading, isDownloaded, localUri, download, remove, removeAll, totalBytes }}>
      {children}
    </DownloadsContext>
  );
}

export function useDownloads(): DownloadsState {
  const value = use(DownloadsContext);
  if (!value) throw new Error('useDownloads must be used inside DownloadsProvider');
  return value;
}
