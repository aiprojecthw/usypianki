import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { Txt } from '@/components/txt';
import { PillButton, SkyBackground, usePalette, useDaypartNavBar } from '@/components/ui';
import { useStartStory } from '@/components/use-start-story';
import { useCatalog } from '@/data/catalog-provider';
import { useDownloads } from '@/data/downloads-provider';
import { useSettings } from '@/data/settings-provider';
import { formatMegabytes, formatMinutes } from '@/theme';
import { emptyBaskets, uiIcons } from '@/ui/media';

/** Pusty koszyk: przed zakupem albo gdy nic jeszcze nie pobrano. */
function EmptyBasket({ purchased }: { purchased: boolean }) {
  const { daypart } = useSettings();
  const palette = usePalette();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
      {/* Grafika ma miękko wygaszone brzegi, więc wtapia się w niebo bez widocznego koła. */}
      <Image source={emptyBaskets[daypart]} style={{ width: 260, height: 260, marginVertical: -20 }} contentFit="contain" />
      <Txt weight="extrabold" size={22} color={palette.text} style={{ textAlign: 'center' }}>
        Tu nic jeszcze nie ma
      </Txt>
      <Txt size={16} color={palette.textMuted} style={{ textAlign: 'center' }}>
        {purchased
          ? 'Włącz bajkę i dotknij „Pobierz”, a zostanie na telefonie do słuchania bez internetu.'
          : 'Pobrane bajki działają bez internetu. Pobieranie włącza rodzic w Strefie rodzica.'}
      </Txt>
      {!purchased && (
        <PillButton
          label="Dla rodzica"
          variant="outline"
          height={48}
          onPress={() => router.push({ pathname: '/gate', params: { next: 'parent' } })}
          icon={<Image source={uiIcons.lock} style={{ width: 22, height: 22 }} contentFit="contain" />}
          colors={{ accent: palette.accent, onAccent: palette.onAccent, text: palette.text, outline: palette.outline }}
        />
      )}
    </View>
  );
}

export default function DownloadsScreen() {
  useDaypartNavBar();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { settings } = useSettings();
  const { stories } = useCatalog();
  const { downloaded } = useDownloads();
  const start = useStartStory();

  const purchased = settings.offlinePurchased;
  const items = purchased ? stories.filter((s) => s.id in downloaded) : [];

  return (
    <SkyBackground>
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Txt weight="extrabold" size={28} color={palette.text} accessibilityRole="header">
          Pobrane
        </Txt>
      </View>

      {items.length === 0 ? (
        <EmptyBasket purchased={purchased} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 8 }}>
          {/* Bez koszy: usuwanie pobranych jest tylko w Strefie rodzica. */}
          {items.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => start(s)}
              accessibilityRole="button"
              accessibilityLabel={`Słuchaj: ${s.title}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 10,
                minHeight: 72,
                borderRadius: 18,
                backgroundColor: palette.card,
                opacity: pressed ? 0.8 : 1,
              })}>
              <Cover story={s} width={56} height={56} radius={14} placeholderColor={palette.coverPlaceholder} />
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={16} color={palette.text}>
                  {s.title}
                </Txt>
                <Txt size={13} color={palette.textMuted}>
                  {formatMinutes(s.durationSec)} · {formatMegabytes(downloaded[s.id] ?? 0)}
                </Txt>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SkyBackground>
  );
}
