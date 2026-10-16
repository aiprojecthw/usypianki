import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { ParentHeader, PillButton, useNavBarStyle } from '@/components/ui';
import { useDownloads } from '@/data/downloads-provider';
import { useSettings } from '@/data/settings-provider';
import { formatClock, shiftBound, type DaypartBounds } from '@/logic/daypart';
import { formatMegabytes, parent, storiesCount } from '@/theme';
import { uiIcons } from '@/ui/media';

function Card({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <View style={{ backgroundColor: strong ? parent.surfaceStrong : parent.surface, borderRadius: 20, padding: 16, gap: 10 }}>
      {children}
    </View>
  );
}

function CardTitle({ children }: { children: string }) {
  return (
    <Txt weight="extrabold" size={13} color={parent.textMuted} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
      {children}
    </Txt>
  );
}

function TimeStepper({ label, value, onChange }: { label: string; value: number; onChange: (delta: number) => void }) {
  const btn = { width: 40, height: 40, borderRadius: 12, backgroundColor: parent.input, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
      <Txt weight="bold" size={16} color={parent.text}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => onChange(-30)} accessibilityRole="button" accessibilityLabel={`${label}: o pół godziny wcześniej`} style={btn}>
          <Icon name="minus" size={20} color={parent.text} />
        </Pressable>
        <Txt weight="bold" size={17} color={parent.text} style={{ width: 58, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
          {formatClock(value)}
        </Txt>
        <Pressable onPress={() => onChange(30)} accessibilityRole="button" accessibilityLabel={`${label}: o pół godziny później`} style={btn}>
          <Icon name="plus" size={20} color={parent.text} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ParentZone() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const { downloaded, totalBytes } = useDownloads();
  const { bounds } = settings;
  const purchased = settings.offlinePurchased;
  const downloadedCount = Object.keys(downloaded).length;

  const shift = (key: keyof DaypartBounds) => (delta: number) => update({ bounds: shiftBound(bounds, key, delta) });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: parent.background, marginTop: insets.top }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, gap: 16 }}>
      <ParentHeader title="Strefa rodzica" onBack={() => router.dismissTo('/')} backLabel="Zamknij strefę rodzica" />

      <Card strong>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={uiIcons.basket} style={{ width: 28, height: 28 }} contentFit="contain" />
          <Txt weight="extrabold" size={17} color={parent.text}>
            Słuchanie bez internetu
          </Txt>
        </View>
        {purchased ? (
          <>
            <Txt size={14} color={parent.textSoft}>
              Kupione. Przy każdej bajce jest przycisk „Pobierz”.
            </Txt>
            <Pressable
              onPress={() => router.push('/manage-downloads')}
              accessibilityRole="button"
              accessibilityLabel="Zarządzaj pobranymi bajkami"
              style={{ minHeight: 56, borderRadius: 16, backgroundColor: parent.surface, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 10 }}>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={16} color={parent.text}>
                  Pobrane bajki
                </Txt>
                <Txt size={13} color={parent.textMuted}>
                  {downloadedCount === 0 ? 'Nic jeszcze nie pobrano' : `${storiesCount(downloadedCount)} · ${formatMegabytes(totalBytes)} na telefonie`}
                </Txt>
              </View>
              <Txt weight="bold" size={14} color={parent.accent}>
                Zarządzaj
              </Txt>
              <Icon name="chevronRight" size={20} color={parent.accent} />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Cofnąć zakup testowy?', 'Tylko w wersji testowej: pobieranie znów będzie zablokowane.', [
                  { text: 'Anuluj', style: 'cancel' },
                  { text: 'Cofnij', onPress: () => update({ offlinePurchased: false }) },
                ])
              }
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: 'center' }}>
              <Txt size={13} color={parent.textMuted} style={{ textDecorationLine: 'underline' }}>
                Wersja testowa: cofnij zakup
              </Txt>
            </Pressable>
          </>
        ) : (
          <>
            <Txt size={14} color={parent.textSoft}>
              Bajki słuchasz online za darmo. Pobieranie bajek na telefon to osobna funkcja, kupowana jednorazowo.
            </Txt>
            <PillButton label="Więcej · 9,99 zł" onPress={() => router.push('/purchase')} height={52} />
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Przywracanie zakupu',
                  'W wydaniu w Google Play zakup przywróci się z Twojego konta Google. W wersji testowej nie ma czego przywracać.'
                )
              }
              accessibilityRole="button"
              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Txt weight="bold" size={14} color={parent.textSoft} style={{ textDecorationLine: 'underline' }}>
                Przywróć zakup
              </Txt>
            </Pressable>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Pory dnia i tapety</CardTitle>
        <TimeStepper label="Dzień od" value={bounds.dayStart} onChange={shift('dayStart')} />
        <TimeStepper label="Wieczór od" value={bounds.eveningStart} onChange={shift('eveningStart')} />
        <TimeStepper label="Noc od" value={bounds.nightStart} onChange={shift('nightStart')} />
        <Txt size={13} color={parent.textMuted}>
          Według zegara telefonu. Wieczorem i w nocy cała aplikacja przyciemnia się.
        </Txt>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={16} color={parent.text}>
              Przypomnienie o bajce
            </Txt>
            <Txt size={13} color={parent.textMuted}>
              {settings.reminderEnabled
                ? 'Włączone · wybór godziny pojawi się w kolejnej wersji'
                : 'Wyłączone · po włączeniu wybierzesz godzinę'}
            </Txt>
          </View>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={(v) => update({ reminderEnabled: v })}
            accessibilityLabel="Przypomnienie o bajce"
            trackColor={{ true: parent.accent, false: parent.border }}
            thumbColor={parent.text}
          />
        </View>
      </Card>


      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
        <Pressable onPress={() => router.push('/about')} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Txt weight="bold" size={14} color={parent.accent}>
            O aplikacji i prywatność
          </Txt>
        </Pressable>
      </View>
    </ScrollView>
  );
}
