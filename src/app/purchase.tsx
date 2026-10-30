import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { goBack, ParentHeader, PillButton, useNavBarStyle } from '@/components/ui';
import { usePurchase } from '@/data/purchase-provider';
import { parent } from '@/theme';

const BENEFITS = [
  'Przycisk „Pobierz” przy każdej dostępnej bajce',
  'Jedna płatność, bez subskrypcji i bez reklam',
  'Zakup przywrócisz na każdym telefonie z tym samym kontem Google',
  'Kupujesz funkcję pobierania, a nie same bajki — te zostają darmowe',
];

/** Zakup funkcji offline przez Google Play. Ekran widzi tylko rodzic (za bramką). */
export default function PurchaseScreen() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();
  const { owned, pending, price, storeStatus, busy, error, buy } = usePurchase();

  // Po udanym zakupie wracamy do „Pobranych”, gdzie od razu widać, co dalej.
  useEffect(() => {
    if (owned) router.dismissTo('/downloads');
  }, [owned]);

  const unavailable = storeStatus === 'unavailable';
  const label = pending ? 'Płatność w toku' : price ? `Kup · ${price}` : 'Kup';

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
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, minHeight: 44 }}>
          {price ? (
            <>
              <Txt weight="extrabold" size={32} color={parent.text}>
                {price}
              </Txt>
              <Txt size={15} color={parent.textMuted}>
                jednorazowo
              </Txt>
            </>
          ) : storeStatus === 'connecting' ? (
            <ActivityIndicator color={parent.textMuted} />
          ) : null}
        </View>
        <PillButton label={label} onPress={buy} height={56} disabled={unavailable || pending || busy || !price} />
        {pending && (
          <Txt size={13} color={parent.textSoft} style={{ textAlign: 'center' }}>
            Google czeka na potwierdzenie płatności. Pobieranie odblokuje się samo, gdy płatność dojdzie.
          </Txt>
        )}
        {storeStatus === 'ready' && !price && !pending && (
          <Txt size={13} color={parent.textSoft} style={{ textAlign: 'center' }}>
            Zakup jest chwilowo niedostępny. Spróbuj ponownie później.
          </Txt>
        )}
        {unavailable && (
          <Txt size={13} color={parent.textSoft} style={{ textAlign: 'center' }}>
            Sklep Google Play jest teraz niedostępny. Sprawdź internet i otwórz ten ekran ponownie.
          </Txt>
        )}
        {error && (
          <Txt size={13} color={parent.danger} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            {error}
          </Txt>
        )}
        <Txt size={12} color={parent.textMuted} style={{ textAlign: 'center' }}>
          Płatność obsługuje Google Play. Zwrot w ciągu 48 godzin zgłosisz bezpośrednio w Google Play.
        </Txt>
      </View>
    </View>
  );
}
