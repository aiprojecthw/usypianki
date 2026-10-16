import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/txt';
import { goBack, ParentHeader, PillButton, useNavBarStyle } from '@/components/ui';
import { isGateAnswerCorrect, makeGateQuestion } from '@/logic/gate';
import { fonts, parent } from '@/theme';
import { uiIcons } from '@/ui/media';

const DESTINATIONS = { parent: '/parent', purchase: '/purchase' } as const;

/** Bramka rodzica: nowe mnożenie przy każdym otwarciu ekranu. */
export default function GateScreen() {
  useNavBarStyle('light');
  const insets = useSafeAreaInsets();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [question, setQuestion] = useState(() => makeGateQuestion());
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

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

  return (
    // Bez KeyboardAvoidingView: Android sam zmniejsza okno przy klawiaturze
    // (softwareKeyboardLayoutMode: resize), a podwójne przesuwanie chowało przycisk.
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: parent.background, marginTop: insets.top }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <ParentHeader onBack={() => goBack('/')} backLabel="Wróć" />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: parent.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={uiIcons.lock} style={{ width: 44, height: 44 }} contentFit="contain" />
        </View>
        <View style={{ gap: 6, alignItems: 'center' }}>
          <Txt weight="extrabold" size={26} color={parent.text} accessibilityRole="header">
            Strefa rodzica
          </Txt>
          <Txt size={16} color={parent.textMuted} style={{ textAlign: 'center', maxWidth: 290 }}>
            Żeby wejść, rozwiąż działanie. Tu są ustawienia i zakupy.
          </Txt>
        </View>

        <Txt weight="extrabold" size={44} color={parent.text} accessibilityLabel={`${question.a} razy ${question.b}`}>
          {question.a} × {question.b} =
        </Txt>

        <View style={{ width: '100%', maxWidth: 260, gap: 6 }}>
          <TextInput
            value={answer}
            onChangeText={(t) => {
              setAnswer(t.replace(/[^\d]/g, '').slice(0, 3));
              setWrong(false);
            }}
            onSubmitEditing={submit}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={3}
            placeholder="?"
            placeholderTextColor={parent.textMuted}
            accessibilityLabel="Wynik działania"
            autoFocus
            style={{
              height: 60,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: wrong ? parent.danger : parent.border,
              backgroundColor: parent.input,
              color: parent.text,
              fontFamily: fonts.extrabold,
              fontSize: 28,
              textAlign: 'center',
            }}
          />
          {wrong && (
            <Txt size={14} color={parent.danger} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
              To nie to. Spróbuj z nowym działaniem.
            </Txt>
          )}
        </View>
      </View>

      <PillButton label="Wejdź" onPress={submit} disabled={answer.length === 0} height={56} />
    </ScrollView>
  );
}
