import Constants from 'expo-constants';
import { ScrollView, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
        {title}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 15, lineHeight: 22 }}>{children}</Text>
    </View>
  );
}

// Treść polityki prywatności do weryfikacji przed publikacją w Google Play.
export default function AboutScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: spacing.lg }}>
      <Section title="Usypianki: Bajki na sen">
        {`Spokojne bajki do słuchania przed snem. Wersja ${Constants.expoConfig?.version ?? ''}.`}
      </Section>
      <Section title="Prywatność">
        Aplikacja nie wyświetla reklam, nie wymaga zakładania konta i nie zbiera danych osobowych. Nie korzysta z analityki ani narzędzi śledzących. Pobrane bajki są zapisywane wyłącznie w pamięci telefonu i można je w każdej chwili usunąć w zakładce „Pobrane”. Aplikacja łączy się z internetem tylko po to, żeby pobrać listę bajek i nagrania.
      </Section>
      <Section title="Kontakt">[ADRES E-MAIL]</Section>
    </ScrollView>
  );
}
