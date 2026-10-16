import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '@/components/cover';
import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { goBack, ParentHeader, PillButton, useNavBarStyle } from '@/components/ui';
import { useCatalog } from '@/data/catalog-provider';
import { useDownloads } from '@/data/downloads-provider';
import { formatMegabytes, formatMinutes, parent, storiesCount } from '@/theme';

/** Usuwanie pobranych bajek — tylko tutaj, za bramką rodzica. */
export default function ManageDownloads() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();
  const { stories } = useCatalog();
  const { downloaded, remove, removeAll, totalBytes } = useDownloads();
  const items = stories.filter((s) => s.id in downloaded);

  const confirmAll = () =>
    Alert.alert('Usunąć wszystkie pobrane?', 'Bajki zostaną w aplikacji, ale bez internetu nie będą działać. Możesz je pobrać ponownie.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń wszystkie', style: 'destructive', onPress: removeAll },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: parent.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}>
      <ParentHeader title="Pobrane bajki" onBack={() => goBack('/parent')} backLabel="Wróć do strefy rodzica" />

      <Txt size={14} color={parent.textMuted} style={{ marginVertical: 12 }}>
        {items.length === 0
          ? 'Na telefonie nie ma pobranych bajek.'
          : `${storiesCount(items.length)} · ${formatMegabytes(totalBytes)} na telefonie. Usunięta bajka zostaje w aplikacji, możesz ją pobrać ponownie.`}
      </Txt>

      <ScrollView contentContainerStyle={{ gap: 8 }}>
        {items.map((s) => (
          <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, paddingLeft: 10, borderRadius: 18, backgroundColor: parent.surface }}>
            <Cover story={s} width={48} height={48} radius={12} placeholderColor={parent.border} />
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={16} color={parent.text}>
                {s.title}
              </Txt>
              <Txt size={13} color={parent.textMuted}>
                {formatMinutes(s.durationSec)} · {formatMegabytes(downloaded[s.id] ?? 0)}
              </Txt>
            </View>
            <Pressable
              onPress={() => remove(s.id)}
              accessibilityRole="button"
              accessibilityLabel={`Usuń z telefonu: ${s.title}`}
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="delete" size={22} color={parent.textMuted} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {items.length > 0 && <PillButton label="Usuń wszystkie pobrane" variant="outline" onPress={confirmAll} />}
    </View>
  );
}
