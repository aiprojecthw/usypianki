import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/txt';
import { goBack, ParentHeader, PillButton, useNavBarStyle } from '@/components/ui';
import { isGateAnswerCorrect, makeGateQuestion } from '@/logic/gate';
import { parent } from '@/theme';
import { uiIcons } from '@/ui/media';

const DESTINATIONS = { parent: '/parent', purchase: '/purchase' } as const;
const MAX_DIGITS = 3;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/** Duży przycisk własnej klawiatury numerycznej. */
function Key({ value, onPress }: { value: (typeof KEYS)[number]; onPress: (v: string) => void }) {
  if (value === '') return <View style={{ flex: 1 }} />;
  const isDelete = value === 'del';
  return (
    <Pressable
      onPress={() => onPress(value)}
      accessibilityRole="button"
      accessibilityLabel={isDelete ? 'Usuń cyfrę' : value}
      style={({ pressed }) => ({
        flex: 1,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? parent.surfaceStrong : isDelete ? 'transparent' : parent.surface,
      })}>
      {isDelete ? (
        <Icon name="backspace" size={26} color={parent.text} />
      ) : (
        <Txt weight="bold" size={26} color={parent.text}>
          {value}
        </Txt>
      )}
    </Pressable>
  );
}

/**
 * Bramka rodzica: nowe mnożenie przy każdym otwarciu ekranu.
 * Własna klawiatura zamiast systemowej — systemowa zasłaniała działanie i przycisk,
 * bo aplikacja rysuje się od krawędzi do krawędzi i okno nie zmniejsza się pod klawiaturą.
 */
export default function GateScreen() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [question, setQuestion] = useState(() => makeGateQuestion());
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (key: string) => {
    setWrong(false);
    if (key === 'del') setAnswer((a) => a.slice(0, -1));
    else setAnswer((a) => (a.length >= MAX_DIGITS ? a : a + key));
  };

  const submit = () => {
    if (isGateAnswerCorrect(question, answer)) {
      const target = DESTINATIONS[(next as keyof typeof DESTINATIONS) ?? 'parent'] ?? '/parent';
      router.replace(target);
      return;
    }
    // Po błędzie nowe działanie, żeby nie dało się zgadywać tego samego.
    setWrong(true);
    setAnswer('');
    setQuestion(makeGateQuestion());
  };

  const rows = [KEYS.slice(0, 3), KEYS.slice(3, 6), KEYS.slice(6, 9), KEYS.slice(9, 12)];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: parent.background,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 24,
      }}>
      <ParentHeader onBack={() => goBack('/')} backLabel="Wróć" />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: parent.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={uiIcons.lock} style={{ width: 36, height: 36 }} contentFit="contain" />
        </View>
        <Txt weight="extrabold" size={24} color={parent.text} accessibilityRole="header">
          Strefa rodzica
        </Txt>
        <Txt size={15} color={parent.textMuted} style={{ textAlign: 'center', maxWidth: 290 }}>
          Żeby wejść, rozwiąż działanie.
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 }}>
          <Txt weight="extrabold" size={38} color={parent.text} accessibilityLabel={`${question.a} razy ${question.b}`}>
            {question.a} × {question.b} =
          </Txt>
          <View
            accessibilityLabel={answer ? `Wynik: ${answer}` : 'Wynik: pusty'}
            style={{
              minWidth: 92,
              height: 58,
              paddingHorizontal: 12,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: wrong ? parent.danger : parent.border,
              backgroundColor: parent.input,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Txt weight="extrabold" size={30} color={answer ? parent.text : parent.textMuted}>
              {answer || '?'}
            </Txt>
          </View>
        </View>
        <Txt
          size={14}
          color={parent.danger}
          style={{ textAlign: 'center', minHeight: 20, opacity: wrong ? 1 : 0 }}
          accessibilityLiveRegion="polite">
          {wrong ? 'To nie to. Spróbuj z nowym działaniem.' : ' '}
        </Txt>
      </View>

      <View style={{ gap: 10, marginBottom: 16 }}>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            {row.map((k, j) => (
              <Key key={`${i}-${j}`} value={k} onPress={press} />
            ))}
          </View>
        ))}
      </View>

      <PillButton label="Wejdź" onPress={submit} disabled={answer.length === 0} height={56} />
    </View>
  );
}
