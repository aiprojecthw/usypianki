import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { Txt } from '@/components/txt';
import { goBack, SkyBackground, useDaypartNavBar, usePalette, WoodenBackButton } from '@/components/ui';
import { useStartStory } from '@/components/use-start-story';
import { useCatalog } from '@/data/catalog-provider';
import { formatMinutes } from '@/theme';

/**
 * Pełna lista bajek w siatce. Później dojdą tu filtry wiekowe i kategorie.
 */
export default function AllStoriesScreen() {
  useDaypartNavBar();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { stories } = useCatalog();
  const start = useStartStory();
  const { width } = useWindowDimensions();
  // Dwie kolumny: 20 px marginesu z każdej strony i 12 px odstępu między kartami.
  const cardWidth = Math.floor((width - 40 - 12) / 2);

  return (
    <SkyBackground>
      <View style={{ marginTop: insets.top, height: 64, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <WoodenBackButton label="Wróć do ekranu głównego" onPress={() => goBack('/')} />
        <Txt weight="extrabold" size={24} color={palette.text} accessibilityRole="header">
          Wszystkie bajki
        </Txt>
      </View>
      <FlatList
        data={stories}
        keyExtractor={(s) => s.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => start(item)}
            accessibilityRole="button"
            accessibilityLabel={`Słuchaj: ${item.title}, ${formatMinutes(item.durationSec)}`}
            style={({ pressed }) => ({
              // Stała szerokość połowy kolumny: pojedyncza bajka w ostatnim rzędzie nie rozciąga się na całą szerokość.
              width: cardWidth,
              backgroundColor: palette.card,
              borderRadius: 18,
              padding: 8,
              gap: 6,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Cover story={item} width={cardWidth - 16} height={cardWidth - 16} radius={13} placeholderColor={palette.coverPlaceholder} />
            <Txt weight="bold" size={15} color={palette.text} numberOfLines={2}>
              {item.title}
            </Txt>
            <Txt size={12} color={palette.textMuted}>
              {[formatMinutes(item.durationSec), item.ageLabel].filter(Boolean).join(' · ')}
            </Txt>
          </Pressable>
        )}
      />
    </SkyBackground>
  );
}
