import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/txt';
import { goBack, ParentHeader, useNavBarStyle } from '@/components/ui';
import { parent } from '@/theme';

type Extra = { privacyPolicyUrl?: string; contactEmail?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
const privacyPolicyUrl = extra.privacyPolicyUrl ?? '';
const contactEmail = extra.contactEmail ?? '';

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

function LinkRow({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityHint={hint}
      style={{ minHeight: 48, justifyContent: 'center' }}>
      <Txt weight="bold" size={16} color={parent.accent} style={{ textDecorationLine: 'underline' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

// Ekran widoczny tylko w Strefie rodzica (za bramką), więc linki wychodzące z aplikacji są tu dozwolone.
export default function AboutScreen() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();

  const openPolicy = () => {
    if (privacyPolicyUrl) void WebBrowser.openBrowserAsync(privacyPolicyUrl);
  };
  const writeEmail = () => {
    if (contactEmail) void Linking.openURL(`mailto:${contactEmail}?subject=${encodeURIComponent('Usypianki')}`);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: parent.background, marginTop: insets.top }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, gap: 24 }}>
      <ParentHeader title="O aplikacji" onBack={() => goBack('/parent')} backLabel="Wróć" />
      <Section title="Usypianki: Bajki na sen">
        {`Spokojne bajki do słuchania przed snem. Wersja ${Constants.expoConfig?.version ?? ''}.`}
      </Section>
      <View style={{ gap: 4 }}>
        <Section title="Prywatność">
          Aplikacja nie wyświetla reklam, nie wymaga zakładania konta i nie zbiera danych osobowych. Nie korzysta z analityki ani narzędzi śledzących. Ustawienia i pobrane bajki są zapisywane wyłącznie w pamięci telefonu. Aplikacja łączy się z internetem tylko po to, żeby pobrać listę bajek i nagrania.
        </Section>
        {privacyPolicyUrl ? (
          <LinkRow label="Pełna polityka prywatności" hint="Otwiera stronę w przeglądarce" onPress={openPolicy} />
        ) : null}
      </View>
      {contactEmail ? (
        <View style={{ gap: 4 }}>
          <Section title="Kontakt">Pytania, problemy z zakupem albo pomysł na bajkę:</Section>
          <LinkRow label={contactEmail} hint="Otwiera aplikację pocztową" onPress={writeEmail} />
        </View>
      ) : null}
    </ScrollView>
  );
}
