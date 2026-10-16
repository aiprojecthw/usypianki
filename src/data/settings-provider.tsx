import { File, Paths } from 'expo-file-system';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DEFAULT_BOUNDS, daypartAt, normalizeBounds, type Daypart, type DaypartBounds } from '@/logic/daypart';
import { isAfterStory, type AfterStory } from '@/logic/resume';

/**
 * Ustawienia trzymane w jednym pliku JSON w pamięci telefonu.
 * Nic z tych danych nie opuszcza urządzenia.
 */
export type Settings = {
  bounds: DaypartBounds;
  /** Co po bajce: cisza albo melodia. Zapamiętywane z wyboru w odtwarzaczu. */
  afterStory: AfterStory;
  /**
   * Czy funkcja pobierania jest odblokowana. W wersji testowej przełączana
   * w Strefie rodzica bez płatności; w wydaniu sklepowym ustawia ją RevenueCat.
   */
  offlinePurchased: boolean;
  /** id bajki → sekunda, na której przerwano */
  positions: Record<string, number>;
};

export const DEFAULT_SETTINGS: Settings = {
  bounds: DEFAULT_BOUNDS,
  afterStory: 'silence',
  offlinePurchased: false,
  positions: {},
};

const settingsFile = new File(Paths.document, 'settings.json');

/** Odczyt odporny na uszkodzony lub stary plik: brakujące pola biorą wartości domyślne. */
export function parseSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  const b = (r.bounds ?? {}) as Record<string, unknown>;
  const bounds = normalizeBounds({
    dayStart: typeof b.dayStart === 'number' ? b.dayStart : DEFAULT_BOUNDS.dayStart,
    eveningStart: typeof b.eveningStart === 'number' ? b.eveningStart : DEFAULT_BOUNDS.eveningStart,
    nightStart: typeof b.nightStart === 'number' ? b.nightStart : DEFAULT_BOUNDS.nightStart,
  });
  const positions: Record<string, number> = {};
  if (typeof r.positions === 'object' && r.positions !== null) {
    for (const [id, v] of Object.entries(r.positions as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) positions[id] = v;
    }
  }
  return {
    bounds,
    afterStory: isAfterStory(r.afterStory) ? r.afterStory : DEFAULT_SETTINGS.afterStory,
    offlinePurchased: typeof r.offlinePurchased === 'boolean' ? r.offlinePurchased : false,
    positions,
  };
}

function loadSettings(): Settings {
  try {
    if (!settingsFile.exists) return DEFAULT_SETTINGS;
    return parseSettings(JSON.parse(settingsFile.textSync()));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings) {
  try {
    settingsFile.write(JSON.stringify(settings));
  } catch {
    // Nieudany zapis nie może zatrzymać odtwarzania; spróbujemy przy następnej zmianie.
  }
}

type SettingsState = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  savePosition: (storyId: string, seconds: number) => void;
  daypart: Daypart;
};

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [now, setNow] = useState(() => new Date());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zapis z małym opóźnieniem: pozycje odtwarzania zmieniają się co kilka sekund.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveSettings(settings), 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [settings]);

  // Pora dnia sprawdzana co 30 s, żeby tapeta zmieniła się sama o 17:00 i 19:00.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const savePosition = useCallback((storyId: string, seconds: number) => {
    setSettings((s) => {
      const rounded = Math.floor(seconds);
      if (s.positions[storyId] === rounded) return s;
      return { ...s, positions: { ...s.positions, [storyId]: rounded } };
    });
  }, []);

  const daypart = daypartAt(now, settings.bounds);

  const value = useMemo(() => ({ settings, update, savePosition, daypart }), [settings, update, savePosition, daypart]);

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings(): SettingsState {
  const value = use(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
