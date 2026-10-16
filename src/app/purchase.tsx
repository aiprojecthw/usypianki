import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { goBack, ParentHeader, PillButton, useNavBarStyle } from '@/components/ui';
import { useSettings } from '@/data/settings-provider';
import { parent } from '@/theme';

const BENEFITS = [
  'Przycisk „Pobierz” przy każdej dostępnej bajce',
  'Jedna płatność, bez subskrypcji i bez reklam',
  'Zakup działa na każdym telefonie z tym samym kontem Google',
  'Kupujesz funkcję pobierania, a nie same bajki',
];

/**
 * Zakup funkcji offline. W tej wersji testowej przycisk odblokowuje funkcję
 * bez płatności; w wydaniu sklepowym zostanie podpięty RevenueCat + Google Play.
 */
export default function PurchaseScreen() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();
  const { update } = useSettings();

  const buy = () => {
    update({ offlinePurchased: true });
    router.dismissTo('/downloads');
  };

  return (
    <View style={{ flex: 1, backgroundColor: parent.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <ParentHeader onBack={() => goBack('/parent')} backLabel="Wróć do strefy rodzica" />

      <View style={{ flex: 1, gap: 22, paddingTop: 8 }}>
        <View style={{ gap: 8 }}>
          <Txt weight="extrabold" size={28} color={parent.text} accessibilityRole="header">
            Bajki zawsze pod ręką
          </Txt>
          <Txt size={16} color={parent.textMuted}>
            Pobierz bajki na telefon i słuchaj bez internetu: w podróży, u dziadków, w trybie samolotowym.
          </Txt>
        </View>
        <View style={{ gap: 14 }}>
          {BENEFITS.map((b) => (
            <View key={b} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Icon name="check" size={22} color={parent.success} />
              <Txt size={16} color={parent.text} style={{ flex: 1 }}>
                {b}
              </Txt>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <Txt weight="extrabold" size={32} color={parent.text}>
            9,99 zł
          </Txt>
          <Txt size={15} color={parent.textMuted}>
            jednorazowo
          </Txt>
        </View>
        <PillButton label="Odblokuj · wersja testowa" onPress={buy} height={56} />
        <Txt size={12} color={parent.textMuted} style={{ textAlign: 'center' }}>
          Wersja testowa: odblokowanie bez płatności. W wydaniu w Google Play płatność obsłuży Google Play. Ten ekran widzi tylko rodzic.
        </Txt>
      </View>
    </View>
  );
}
