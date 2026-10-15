import Constants from 'expo-constants';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/txt';
import { goBack, ParentHeader } from '@/components/ui';
import { parent } from '@/theme';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt weight="bold" size={17} color={parent.text} accessibilityRole="header">
        {title}
      </Txt>
      <Txt size={15} color={parent.textMuted}>
        {children}
      </Txt>
    </View>
  );
}

// Treść polityki prywatności do weryfikacji przed publikacją w Google Play.
export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: parent.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, gap: 24 }}>
      <ParentHeader title="O aplikacji" onBack={() => goBack('/parent')} backLabel="Wróć" />
      <Section title="Usypianki: Bajki na sen">
        {`Spokojne bajki do słuchania przed snem. Wersja ${Constants.expoConfig?.version ?? ''} (testowa).`}
      </Section>
      <Section title="Prywatność">
        Aplikacja nie wyświetla reklam, nie wymaga zakładania konta i nie zbiera danych osobowych. Nie korzysta z analityki ani narzędzi śledzących. Ustawienia i pobrane bajki są zapisywane wyłącznie w pamięci telefonu. Aplikacja łączy się z internetem tylko po to, żeby pobrać listę bajek i nagrania.
      </Section>
      <Section title="Kontakt">[ADRES E-MAIL]</Section>
    </ScrollView>
  );
}
