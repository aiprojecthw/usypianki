import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import { fallbackCatalog } from './fallback-catalog';
import { parseCatalog, type Catalog, type Story } from './types';

const catalogUrl: string =
  (Constants.expoConfig?.extra as { catalogUrl?: string } | undefined)?.catalogUrl ?? '';

// Ostatni pobrany katalog trzymamy na telefonie, żeby lista działała bez internetu.
const cacheFile = new File(Paths.document, 'catalog.json');

async function readCachedCatalog(): Promise<Catalog | null> {
  try {
    if (!cacheFile.exists) return null;
    return parseCatalog(JSON.parse(await cacheFile.text()));
  } catch {
    return null;
  }
}

async function fetchRemoteCatalog(): Promise<Catalog | null> {
  if (!catalogUrl) return null;
  const response = await fetch(catalogUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const catalog = parseCatalog(JSON.parse(text));
  if (catalog) {
    try {
      cacheFile.write(text);
    } catch {
      // Brak zapisu w pamięci podręcznej nie blokuje wyświetlenia katalogu.
    }
  }
  return catalog;
}

type CatalogState = {
  stories: Story[];
  featured: Story | undefined;
  loading: boolean;
  /** true, gdy pokazujemy dane testowe, bo nie ustawiono adresu katalogu. */
  isTestData: boolean;
  refresh: () => Promise<void>;
  getStory: (id: string) => Story | undefined;
};

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Na start bajki testowe z aplikacji; zastępuje je katalog z telefonu albo z serwera.
  // Dzięki temu pierwsze uruchomienie bez internetu nie pokazuje pustej listy.
  const [catalog, setCatalog] = useState<Catalog>(fallbackCatalog);
  const [loading, setLoading] = useState(Boolean(catalogUrl));

  const refresh = useCallback(async () => {
    if (!catalogUrl) return;
    setLoading(true);
    try {
      const remote = await fetchRemoteCatalog();
      if (remote) setCatalog(remote);
    } catch {
      // Offline albo błąd serwera: zostajemy przy katalogu z pamięci telefonu.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!catalogUrl) return;
    let cancelled = false;
    readCachedCatalog().then((cached) => {
      if (!cancelled && cached) setCatalog(cached);
      refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const stories = catalog.stories;
  const featured = stories.find((s) => s.featured) ?? stories[0];
  const getStory = useCallback((id: string) => stories.find((s) => s.id === id), [stories]);

  return (
    <CatalogContext value={{ stories, featured, loading, isTestData: !catalogUrl, refresh, getStory }}>
      {children}
    </CatalogContext>
  );
}

export function useCatalog(): CatalogState {
  const value = use(CatalogContext);
  if (!value) throw new Error('useCatalog must be used inside CatalogProvider');
  return value;
}
